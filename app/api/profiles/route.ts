import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import type { Profile } from '@/app/types/profile';

const dataFilePath = path.join(process.cwd(), 'public/data/profiles.json');

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading profiles:', error);
    return NextResponse.json({ error: 'Failed to load profiles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Ensure the file exists and read current data
    let profiles: Profile[] = [];
    try {
      const fileContents = await fs.readFile(dataFilePath, 'utf8');
      profiles = JSON.parse(fileContents);
    } catch (error) {
      // If file doesn't exist or is empty, start with empty array
      console.log('Creating new profiles file or resetting corrupt file');
    }

    const newProfile: Profile = {
        ...body,
        id: body.id || `profile-${Date.now()}`
    };

    profiles.push(newProfile);

    await fs.writeFile(dataFilePath, JSON.stringify(profiles, null, 2));

    return NextResponse.json(newProfile);
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}

