import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function normalizeCode(value: string) {
  return value.toUpperCase().trim().replace(/[^\w]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const { teamId, answer } = await request.json();

    // Validate input
    if (!teamId || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    const cleanAnswer = normalizeCode(answer);

    const { data: validFinalCodes } = await supabase
      .from('final_passcodes')
      .select('passcode')
      .eq('is_active', true);

    const isCorrect = (validFinalCodes || []).some((row) => normalizeCode(row.passcode) === cleanAnswer);

    if (!isCorrect) {
      return NextResponse.json(
        { error: 'Incorrect passcode. Try again!' },
        { status: 401 }
      );
    }

    // Final answer is correct: stop timer by writing end_time and total_time.
    const { data: teamBefore, error: fetchError } = await supabase
      .from('teams')
      .select('id, start_time, penalty_seconds')
      .eq('id', teamId)
      .single();

    if (fetchError || !teamBefore) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const now = new Date();
    const startedAt = new Date(teamBefore.start_time);
    const rawSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
    const totalTime = rawSeconds + (teamBefore.penalty_seconds || 0);

    const { data: team, error } = await supabase
      .from('teams')
      .update({
        completion_status: 'completed',
        current_level: 6,
        end_time: now.toISOString(),
        total_time: totalTime,
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) {
      console.error('Error completing quest:', error);
      return NextResponse.json(
        { error: 'Failed to complete quest' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'You have found the treasure!',
      team,
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
