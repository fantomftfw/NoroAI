import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'


export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'monthly'; // 'weekly', 'monthly', 'yearly'
    const now = new Date();
    const { userId } = await auth();

    let startDate: Date, endDate: Date;

    if (period === 'weekly') {
      // Accept optional weekStart param (YYYY-MM-DD), else use current week
      const weekStartParam = searchParams.get('weekStart');
      let weekStart: Date;
      if (weekStartParam) {
        weekStart = new Date(weekStartParam);
      } else {
        // Default: start of current week (Monday)
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
        weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
      }
      startDate = new Date(weekStart);
      endDate = new Date(weekStart);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'yearly') {
      // Accept optional year param
      const year = parseInt(searchParams.get('year') || now.getFullYear().toString());
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    } else {
      // Default: monthly
      const year = parseInt(searchParams.get('year') || now.getFullYear().toString());
      const month = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString()) - 1; // 0-indexed month
      startDate = new Date(year, month, 1, 0, 0, 0, 0);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    }

    // Format dates for Supabase query (ISO string without milliseconds)
    const formatDate = (date: Date) => date.toISOString().replace(/\.\d+Z$/, 'Z');
    const startISO = formatDate(startDate);
    const endISO = formatDate(endDate);

    const supabase = await createServerSupabaseClient();

    // Query for created tasks
    const { count: createdCount, error: createdError } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (createdError) throw createdError;

    // Query for completed tasks
    const { count: completedCount, error: completedError } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('isCompleted', true)
      .gte('completedAt', startISO)
      .lte('completedAt', endISO);

    if (completedError) throw completedError;

    return NextResponse.json({
      period,
      start: startISO,
      end: endISO,
      created: createdCount ?? 0,
      completed: completedCount ?? 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { message: 'Error fetching stats' },
      { status: 500 }
    );
  }
}
