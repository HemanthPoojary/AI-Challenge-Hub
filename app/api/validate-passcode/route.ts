import { createClient } from '@/lib/supabase/server';
import { getQuestionIdForLevel, QUESTION_BANK } from '@/lib/game-config';
import { NextRequest, NextResponse } from 'next/server';

const FIXED_REWARD_BY_LEVEL: Record<number, number> = {
  1: 16,
  2: 18,
  3: 11,
  4: 25,
  5: 1,
};

export async function POST(request: NextRequest) {
  try {
    const { teamId, level, passcode } = await request.json();

    // Validate input
    if (!teamId || !level || !passcode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate level (game levels only; final challenge handled separately)
    if (level < 1 || level > 5) {
      return NextResponse.json(
        { error: 'Invalid level' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server configuration missing: set Supabase URL and ANON key in environment variables.' },
        { status: 503 }
      );
    }
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, current_level, penalty_seconds, question_order')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.current_level !== level) {
      return NextResponse.json(
        { error: `This passcode is for level ${team.current_level}.` },
        { status: 409 }
      );
    }

    const questionOrder = Array.isArray(team.question_order) && team.question_order.length === 5
      ? team.question_order
      : [1, 2, 3, 4, 5];
    const questionId = getQuestionIdForLevel(level, questionOrder);
    const expected = QUESTION_BANK[questionId];
    if (!expected) {
      return NextResponse.json({ error: 'Invalid question mapping for this team.' }, { status: 500 });
    }
    const isValid = passcode.toUpperCase().trim() === expected.passcode.toUpperCase();

    if (!isValid) {
      const { data: existingAttempt } = await supabase
        .from('level_attempts')
        .select('attempt_count')
        .eq('team_id', teamId)
        .eq('level', level)
        .single();

      const newAttemptCount = (existingAttempt?.attempt_count || 0) + 1;

      const { error: attemptError } = await supabase.from('level_attempts').upsert(
        {
          team_id: teamId,
          level,
          attempt_count: newAttemptCount,
          last_attempt_at: new Date().toISOString(),
        },
        { onConflict: 'team_id,level' }
      );

      if (attemptError) {
        return NextResponse.json(
          { error: `Failed to record attempt: ${attemptError.message}` },
          { status: 500 }
        );
      }

      const newPenalty = (team.penalty_seconds || 0) + 60;
      const { error: penaltyError } = await supabase
        .from('teams')
        .update({ penalty_seconds: newPenalty })
        .eq('id', teamId);

      if (penaltyError) {
        return NextResponse.json(
          { error: `Failed to update penalty: ${penaltyError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid passcode. Try again!', penaltySeconds: newPenalty, attempts: newAttemptCount },
        { status: 401 }
      );
    }

    // Log level completion and progress on successful validation.
    await supabase.from('level_completions').upsert({
      team_id: teamId,
      level,
      completed_at: new Date().toISOString(),
    });

    const nextLevel = Math.min(level + 1, 6);
    await supabase.from('teams').update({ current_level: nextLevel }).eq('id', teamId);

    return NextResponse.json(
      {
        success: true,
        message: 'Passcode correct!',
        // Reward numbers stay fixed by level order even when questions are shuffled.
        revealNumber: FIXED_REWARD_BY_LEVEL[level],
        nextLevel,
        penaltySeconds: team.penalty_seconds || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
