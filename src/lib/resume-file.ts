import path from 'path';

const RESUME_PUBLIC_PREFIX = '/uploads/resumes/';
const RESUME_UPLOAD_ROOT = path.resolve(process.cwd(), 'public', 'uploads', 'resumes');

/**
 * 校验简历路径是否安全（必须位于 /uploads/resumes/ 目录内且不包含路径穿越）
 */
export function isSafeResumePath(resumePath: string): boolean {
  return resolveSafeResumeFilePath(resumePath) !== null;
}

/**
 * 将数据库或请求中的简历路径安全解析为磁盘绝对路径。
 * 若路径试图逃逸出 public/uploads/resumes 目录，返回 null。
 */
export function resolveSafeResumeFilePath(resumePath: string): string | null {
  if (!resumePath || typeof resumePath !== 'string') {
    return null;
  }

  const trimmed = resumePath.trim();
  if (!trimmed || trimmed.includes('\0') || trimmed.includes('\\')) {
    return null;
  }

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (!normalized.startsWith(RESUME_PUBLIC_PREFIX)) {
    return null;
  }

  const relativePath = normalized.slice(1);
  const resolvedPath = path.resolve(process.cwd(), 'public', relativePath);
  const expectedPrefix = `${RESUME_UPLOAD_ROOT}${path.sep}`;

  if (!resolvedPath.startsWith(expectedPrefix)) {
    return null;
  }

  return resolvedPath;
}

/**
 * 根据文件扩展名返回简历文件对应的 Content-Type
 */
export function getResumeContentType(filePath: string): string {
  const ext = path.extname(filePath || '').toLowerCase();
  if (ext === '.pdf') {
    return 'application/pdf';
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return 'image/jpeg';
  }
  if (ext === '.png') {
    return 'image/png';
  }
  return 'application/octet-stream';
}
