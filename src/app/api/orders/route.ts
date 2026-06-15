import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER!;
const GITHUB_REPO = process.env.GITHUB_REPO!;
const DATA_FILE_PATH = 'data/work_orders.json';

const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_FILE_PATH}`;

async function getFileSha() {
  const res = await fetch(GITHUB_API_URL, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  const json = await res.json();
  return { sha: json.sha, content: json.content };
}

// GET: 전체 작업지시서 목록 불러오기
export async function GET() {
  try {
    const data = await getFileSha();
    if (!data) {
      return NextResponse.json([]);
    }
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    return NextResponse.json(JSON.parse(decoded));
  } catch {
    return NextResponse.json([]);
  }
}

// POST: 새 작업지시서 저장
export async function POST(request: Request) {
  try {
    const newOrder = await request.json();

    // 기존 데이터 가져오기
    const data = await getFileSha();
    let orders = [];
    let sha = null;

    if (data) {
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      orders = JSON.parse(decoded);
      sha = data.sha;
    }

    // 새 지시서 추가 (맨 앞에)
    orders.unshift({ ...newOrder, id: Date.now().toString(), createdAt: new Date().toISOString() });

    // GitHub에 저장
    const body: any = {
      message: `작업지시서 등록: ${newOrder.productName}`,
      content: Buffer.from(JSON.stringify(orders, null, 2)).toString('base64'),
    };
    if (sha) body.sha = sha;

    const res = await fetch(GITHUB_API_URL, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
