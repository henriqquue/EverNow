import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testimonialId } = await params;
    const body = await req.json();
    
    const testimonial = await prisma.landingTestimonial.update({
      where: { id: testimonialId },
      data: body
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testimonialId } = await params;
    await prisma.landingTestimonial.delete({
      where: { id: testimonialId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
