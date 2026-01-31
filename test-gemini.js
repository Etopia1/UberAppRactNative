const fetch = require('node-fetch');

const API_KEY = 'AIzaSyDnlLFwSuJQT0N9E4R4QZBA5H5XM6ciSlA';

async function testGemini() {
    console.log('Testing gemini-2.0-flash-lite...');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
        } else {
            console.log('Success! Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

testGemini();
