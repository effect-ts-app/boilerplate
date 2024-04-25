import { NextRequest, NextResponse } from 'next/server';

export const GET = (req: NextRequest, res: NextResponse ) => {
  return Response.json({ text: 'Hello'})
};
