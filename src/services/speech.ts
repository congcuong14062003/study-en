export function compareTranscript(expectedText: string, transcript: string) {
    const tokens = (s: string) => s.toLowerCase().replace(/[^a-z'\s]/g, "").trim().split(/\s+/).filter(Boolean);
    const expected = tokens(expectedText), actual = tokens(transcript);
    const distance = Array.from({ length: expected.length + 1 }, (_, i) => Array.from({ length: actual.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= expected.length; i++)
        for (let j = 1; j <= actual.length; j++)
            distance[i][j] = Math.min(distance[i - 1][j] + 1, distance[i][j - 1] + 1, distance[i - 1][j - 1] + (expected[i - 1] === actual[j - 1] ? 0 : 1));
    let i = expected.length, j = actual.length;
    const missingWords: string[] = [];
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && expected[i - 1] === actual[j - 1]) {
            i--;
            j--;
        }
        else if (i > 0 && j > 0 && distance[i][j] === distance[i - 1][j - 1] + 1) {
            missingWords.unshift(expected[--i]);
            j--;
        }
        else if (i > 0 && distance[i][j] === distance[i - 1][j] + 1) {
            missingWords.unshift(expected[--i]);
        }
        else
            j--;
    }
    return { recognizedAccuracy: expected.length ? Math.max(0, Math.round((1 - distance[expected.length][actual.length] / expected.length) * 100)) : 0, missingWords, transcript, notice: "Độ khớp lời nói được nhận dạng, không phải điểm phát âm hay ngữ điệu." };
}
