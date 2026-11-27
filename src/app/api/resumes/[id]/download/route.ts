import { NextResponse } from 'next/server';
import { getStudentById } from '@/lib/db/queries';
import { getCurrentUser } from '@/lib/auth';
import { getResumeContentType, resolveSafeResumeFilePath } from '@/lib/resume-file';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 验证用户登录状态
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return NextResponse.json(
        { success: false, message: '无效的简历ID' },
        { status: 400 }
      );
    }

    // 从数据库获取学生信息
    const students = await getStudentById(studentId);
    if (!students || students.length === 0) {
      return NextResponse.json(
        { success: false, message: '简历不存在' },
        { status: 404 }
      );
    }

    const student = students[0];

    if (!student.resumePdf) {
      return NextResponse.json(
        { success: false, message: '该候选人没有上传简历' },
        { status: 404 }
      );
    }

    const absolutePath = resolveSafeResumeFilePath(student.resumePdf);
    if (!absolutePath) {
      return NextResponse.json(
        { success: false, message: '无效的简历文件路径' },
        { status: 400 }
      );
    }

    try {
      await fs.access(absolutePath);
    } catch {
      return NextResponse.json(
        { success: false, message: '简历文件不存在' },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = getResumeContentType(absolutePath);

    // 返回正确的响应
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="resume_${studentId}${ext || '.pdf'}"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ success: false, message: '下载失败' }, { status: 500 });
  }
}
