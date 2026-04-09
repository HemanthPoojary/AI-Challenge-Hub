import { createClient } from '@/lib/supabase/server';
import { getQuestionOrderForSlot, QUESTION_SHUFFLES } from '@/lib/game-config';
import { NextRequest, NextResponse } from 'next/server';

// Simple hash for demo - in production use bcrypt library
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export async function POST(request: NextRequest) {
  try {
    const { teamName, password } = await request.json();

    // Validate input
    if (!teamName || !password) {
      return NextResponse.json(
        { error: 'Team name and password are required' },
        { status: 400 }
      );
    }

    if (teamName.length < 2 || teamName.length > 50) {
      return NextResponse.json(
        { error: 'Team name must be 2-50 characters' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
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

    // Hash password
    const passwordHash = simpleHash(password);

    // Check if team name already exists
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('team_name', teamName)
      .single();

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team name already exists' },
        { status: 409 }
      );
    }

    // Assign one of 8 shuffle patterns across teams.
    const { count } = await supabase.from('teams').select('*', { count: 'exact', head: true });
    const shuffleSlot = (count || 0) % QUESTION_SHUFFLES.length;
    const questionOrder = getQuestionOrderForSlot(shuffleSlot);

    // Create new team (new schema first, fallback for older schema)
    const now = new Date();
    let insertResult = await supabase
      .from('teams')
      .insert({
        team_name: teamName,
        password_hash: passwordHash,
        start_time: now.toISOString(),
        current_level: 1,
        total_time: 0,
        penalty_seconds: 0,
        completion_status: 'in_progress',
        question_order: questionOrder,
        shuffle_slot: shuffleSlot,
      })
      .select()
      .single();

    if (insertResult.error && /question_order|shuffle_slot/.test(insertResult.error.message || '')) {
      insertResult = await supabase
        .from('teams')
        .insert({
          team_name: teamName,
          password_hash: passwordHash,
          start_time: now.toISOString(),
          current_level: 1,
          total_time: 0,
          penalty_seconds: 0,
          completion_status: 'in_progress',
        })
        .select()
        .single();
    }
    const { data, error } = insertResult;

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { error: error.message || 'Registration failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      team_name: data.team_name,
      current_level: data.current_level,
      start_time: data.start_time,
      penalty_seconds: data.penalty_seconds || 0,
      question_order: data.question_order || [1, 2, 3, 4, 5],
      questionOrder: data.question_order || [1, 2, 3, 4, 5],
      completion_status: data.completion_status,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
