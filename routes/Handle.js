const { google } = require('googleapis');
const express = require('express');
const router = express.Router();

router.post('/create-google-meet-event', async (req, res) => {
  const { consultantId } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  // You should verify the token and fetch user info here...

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: 'Consultation with Consultant',
    description: 'Consultation via Google Meet.',
    start: {
      dateTime: '2024-11-12T09:00:00-07:00', // Set the actual time dynamically
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: '2024-11-12T10:00:00-07:00', // Set the actual time dynamically
      timeZone: 'America/Los_Angeles',
    },
    conferenceData: {
      createRequest: {
        requestId: `random-id-${consultantId}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
        status: { statusCode: 'success' },
      },
    },
  };

  try {
    const eventResponse = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });
    res.json({ meetLink: eventResponse.data.hangoutLink });
  } catch (error) {
    res.status(500).json({ error: 'Error creating Google Meet event' });
  }
});

module.exports = router;
