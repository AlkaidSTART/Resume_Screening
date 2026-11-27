import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  getResumeContentType,
  isSafeResumePath,
  resolveSafeResumeFilePath,
} from '../src/lib/resume-file.ts';

describe('resume-file security helpers', () => {
  it('accepts valid paths inside /uploads/resumes/', () => {
    const resolved = resolveSafeResumeFilePath('/uploads/resumes/resume_123.pdf');
    assert.equal(
      resolved,
      path.resolve(process.cwd(), 'public', 'uploads', 'resumes', 'resume_123.pdf')
    );
    assert.equal(isSafeResumePath('uploads/resumes/candidate.png'), true);
  });

  it('rejects path traversal and out-of-directory paths', () => {
    const maliciousPaths = [
      '../../.env',
      '/uploads/resumes/../../.env',
      '/uploads/resumes/../../../etc/passwd',
      '/uploads/avatars/user.png',
      '/uploads/resumes-evil/file.pdf',
      '/uploads/resumes/..\\..\\secret.txt',
      '/uploads/resumes/file.pdf\0.png',
      '',
      '   ',
    ];

    for (const candidate of maliciousPaths) {
      assert.equal(
        resolveSafeResumeFilePath(candidate),
        null,
        `Expected null for: ${candidate}`
      );
      assert.equal(
        isSafeResumePath(candidate),
        false,
        `Expected false for: ${candidate}`
      );
    }
  });

  it('maps supported resume extensions to accurate MIME types', () => {
    assert.equal(getResumeContentType('/uploads/resumes/a.pdf'), 'application/pdf');
    assert.equal(getResumeContentType('/uploads/resumes/a.PDF'), 'application/pdf');
    assert.equal(getResumeContentType('/uploads/resumes/a.jpg'), 'image/jpeg');
    assert.equal(getResumeContentType('/uploads/resumes/a.jpeg'), 'image/jpeg');
    assert.equal(getResumeContentType('/uploads/resumes/a.png'), 'image/png');
    assert.equal(
      getResumeContentType('/uploads/resumes/a.bin'),
      'application/octet-stream'
    );
  });
});
