import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createApiKey } from '@/lib/db/queries';
import { getCurrentUser } from '@/lib/auth';

/**
 * @swagger
 * /api/settings/keys/generate:
 *   post:
 *     tags:
 *       - Settings
 *     summary: 生成新的 API 密钥
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiration:
 *                 type: string
 *                 description: 有效期（天数），'never' 表示永久
 *                 example: "30"
 *     responses:
 *       200:
 *         description: 成功生成密钥
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 key:
 *                   type: string
 *                 created:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *       500:
 *         description: 服务器内部错误
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: '请先登录' }, { status: 401 });
    }

    const { expiration } = await request.json();

    let expiresAt: string | undefined = undefined;
    if (expiration && expiration !== 'never') {
      const days = Number.parseInt(String(expiration), 10);
      if (!Number.isFinite(days) || days < 1) {
        return NextResponse.json(
          { success: false, message: '无效的有效期天数' },
          { status: 400 }
        );
      }
      const date = new Date();
      date.setDate(date.getDate() + days);
      expiresAt = date.toISOString().split('T')[0];
    }

    const newKey = {
      id: Date.now().toString(),
      name: 'New API Key',
      key: `sk_live_${crypto.randomBytes(24).toString('hex')}`,
      created: new Date().toISOString().split('T')[0],
      expiresAt
    };

    const created = await createApiKey(newKey);
    return NextResponse.json(created);
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate API key' },
      { status: 500 }
    );
  }
}
