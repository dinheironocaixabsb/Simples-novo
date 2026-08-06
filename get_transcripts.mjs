import { YoutubeTranscript } from 'youtube-transcript';

const urls = [
    "https://www.youtube.com/watch?v=q4R-VE293ik",
    "https://youtu.be/BEj9ga8kKdQ",
    "https://youtu.be/nySXVt3rEng",
    "https://youtu.be/bEFgJRxOLr4"
];

async function run() {
    for (const url of urls) {
        console.log(`\n\n--- Transcript for ${url} ---`);
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(url, { lang: 'pt' });
            const text = transcript.map(t => t.text).join(' ');
            console.log(text);
        } catch (e) {
            console.log(`Failed to fetch transcript: ${e.message}`);
        }
    }
}

run();
