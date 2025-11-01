import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Returns mapping of category folder -> array of public URL image paths
export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), 'apps', 'web', 'public', 'UK_Removal_Dataset', 'Images_Only');

    // Fallback if project runs from apps/web working directory
    const altDir = path.join(process.cwd(), 'public', 'UK_Removal_Dataset', 'Images_Only');

    let rootDir = baseDir;
    try {
      await fs.readdir(baseDir);
    } catch {
      rootDir = altDir;
    }

    const categories = await fs.readdir(rootDir, { withFileTypes: true });
    const result: Record<string, string[]> = {};

    for (const dirent of categories) {
      if (!dirent.isDirectory()) continue;
      const categoryFolder = dirent.name; // e.g., Bedroom_Furniture
      const categoryPath = path.join(rootDir, categoryFolder);
      const files = await fs.readdir(categoryPath, { withFileTypes: true });
      const images: string[] = [];

      for (const f of files) {
        if (!f.isFile()) continue;
        const ext = path.extname(f.name).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
        const publicUrl = `/UK_Removal_Dataset/Images_Only/${categoryFolder}/${f.name}`;
        images.push(publicUrl);
      }

      if (images.length > 0) {
        result[categoryFolder] = images;
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to read dataset images' }, { status: 500 });
  }
}


