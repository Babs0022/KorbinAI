
'use server';
/**
 * @fileOverview An AI tool for getting the current time in a specific location.
 * This file defines a Genkit tool that the main conversational agent can use
 * to answer questions about the current time.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const getCurrentTime = ai.defineTool(
  {
    name: 'getCurrentTime',
    description: 'Gets the current time for a specified location. Use this when the user asks for the current time, date, or day in a city or country.',
    inputSchema: z.object({
      location: z.string().describe('The city or country, e.g., "Paris" or "Nigeria".'),
    }),
    outputSchema: z.string().describe("The current date and time in the specified location, formatted as a human-readable string."),
  },
  async ({ location }) => {
    // This is a simplified implementation. A production app would use a robust
    // timezone API to look up the correct IANA timezone identifier for the location.
    // For now, we'll use a hardcoded map for common examples.
    const timeZoneMap: { [key: string]: string } = {
        'new york': 'America/New_York',
        'london': 'Europe/London',
        'paris': 'Europe/Paris',
        'tokyo': 'Asia/Tokyo',
        'sydney': 'Australia/Sydney',
        'nigeria': 'Africa/Lagos',
        'lagos': 'Africa/Lagos',
    };
    
    const timeZone = timeZoneMap[location.toLowerCase()];
    
    if (!timeZone) {
        return `I'm sorry, I don't have the exact timezone information for ${location}. I can only provide time for major cities.`;
    }

    try {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
            timeZoneName: 'short',
        });
        return formatter.format(date);
    } catch (error) {
        console.error(`Error getting time for ${location}:`, error);
        return `I encountered an error trying to get the time for ${location}.`;
    }
  }
);
