import { YoutubeTranscript } from 'youtube-transcript';
import fs from 'fs';

const urls = [
    { url: "https://www.youtube.com/watch?v=q4R-VE293ik", file: "C:\\Users\\isaac\\.gemini\\antigravity-ide\\brain\\5aaf0664-143e-4343-ab56-0640d8e6d3b5\\scratch\\transcript_1.txt" },
    { url: "https://youtu.be/BEj9ga8kKdQ", file: "C:\\Users\\isaac\\.gemini\\antigravity-ide\\brain\\5aaf0664-143e-4343-ab56-0640d8e6d3b5\\scratch\\transcript_2.txt" },
    { url: "https://youtu.be/nySXVt3rEng", file: "C:\\Users\\isaac\\.gemini\\antigravity-ide\\brain\\5aaf0664-143e-4343-ab56-0640d8e6d3b5\\scratch\\transcript_3.txt" },
    { url: "https://youtu.be/bEFgJRxOLr4", file: "C:\\Users\\isaac\\.gemini\\antigravity-ide\\brain\\5aaf0664-143e-4343-ab56-0640d8e6d3b5\\scratch\\transcript_4.txt" }
];

async function run() {
    for (const item of urls) {
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(item.url, { lang: 'pt' });
            const text = transcript.map(t => t.text).join(' ');
            fs.writeFileSync(item.file, text);
            console.log(`Saved ${item.url} to ${item.file}`);
        } catch (e) {
            console.log(`Failed to fetch transcript for ${item.url}: ${e.message}`);
        }
    }
}

run();
