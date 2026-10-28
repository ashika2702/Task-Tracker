import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10);
    const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10);

    // Calculate start and end dates for the given month (UTC)
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const records = await prisma.attendanceRecord.findMany({
      where: {
        userId: session.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Compute monthly summary counts
    let wfhCount = 0;
    let leaveCount = 0;
    let halfDayCount = 0;

    for (const r of records) {
      if (r.type === "WFH") wfhCount++;
      else if (r.type === "LEAVE") leaveCount++;
      else if (r.type === "HALF_DAY") halfDayCount++;
    }

    return NextResponse.json({
      records,
      stats: {
        wfhCount,
        leaveCount,
        halfDayCount,
        totalLogged: records.length,
      },
      month,
      year,
    });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return NextResponse.json({ error: "Failed to load attendance records" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { startDate, endDate, type, note } = body;

    if (!startDate) {
      return NextResponse.json({ error: "Start date is required." }, { status: 400 });
    }

    if (!["WFH", "LEAVE", "HALF_DAY"].includes(type)) {
      return NextResponse.json({ error: "Invalid attendance type." }, { status: 400 });
    }

    // Determine date list
    const datesToMark: Date[] = [];
    const start = new Date(startDate + "T00:00:00.000Z");
    const end = endDate ? new Date(endDate + "T00:00:00.000Z") : start;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
    }

    const current = new Date(start);
    while (current <= end) {
      datesToMark.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Upsert each date
    const operations = datesToMark.map((d) =>
      prisma.attendanceRecord.upsert({
        where: {
          userId_date: {
            userId: session.id,
            date: d,
          },
        },
        update: {
          type,
          note: note?.trim() || null,
        },
        create: {
          userId: session.id,
          date: d,
          type,
          note: note?.trim() || null,
        },
      })
    );

    await prisma.$transaction(operations);

    return NextResponse.json({ success: true, count: datesToMark.length });
  } catch (error: any) {
    console.error("Error saving attendance record:", error);
    return NextResponse.json({ error: error.message || "Failed to save attendance record." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const dateStr = searchParams.get("date");

    if (id) {
      await prisma.attendanceRecord.deleteMany({
        where: {
          id,
          userId: session.id,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (dateStr) {
      const d = new Date(dateStr + "T00:00:00.000Z");
      await prisma.attendanceRecord.deleteMany({
        where: {
          userId: session.id,
          date: d,
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "ID or Date is required to delete." }, { status: 400 });
  } catch (error: any) {
    console.error("Error deleting attendance record:", error);
    return NextResponse.json({ error: error.message || "Failed to delete record." }, { status: 500 });
  }
}
