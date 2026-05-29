import { writeFile, stat, mkdir } from 'fs/promises';
import { NextResponse } from 'next/server';
import { join } from 'path';

// Helper function to ensure a directory exists
async function ensureDir(dirPath) {
  try {
    await stat(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If directory doesn't exist, create it
      await mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Convert file data to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Define the path for the uploads directory inside the public folder
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure the uploads directory exists
    await ensureDir(uploadsDir);

    // Create a unique filename to prevent overwrites and clean up the name
    const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = join(uploadsDir, uniqueFilename);

    // Write the file to the filesystem
    await writeFile(filePath, buffer);

    // Return the public URL of the uploaded file
    const fileUrl = `/uploads/${uniqueFilename}`;
    
    return NextResponse.json({
      message: 'File uploaded successfully!',
      url: fileUrl,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}