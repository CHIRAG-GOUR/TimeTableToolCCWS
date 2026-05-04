import { NextResponse } from 'next/server';
import { getDataStore, updateDataStore, MockData, initialMockData } from '@/data/mockData';

export async function GET() {
  try {
    const data = getDataStore();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const newData: MockData = await request.json();
    
    // Basic validation
    if (!newData.teachers || !newData.subjects || !newData.classes || !newData.assignments || !newData.bellSchedule) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format. Required: teachers, subjects, classes, assignments, bellSchedule.' },
        { status: 400 }
      );
    }


    updateDataStore(newData);
    return NextResponse.json({ success: true, data: getDataStore() });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
export async function DELETE() {
  try {
    updateDataStore(JSON.parse(JSON.stringify(initialMockData)));
    return NextResponse.json({ success: true, message: 'Data store reset successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
