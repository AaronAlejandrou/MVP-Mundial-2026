const fs = require('fs');

const logPath = 'C:\\Users\\Roandrinho\\.gemini\\antigravity\\brain\\9474b0b5-a8e1-44b0-bfda-5a1963df0984\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.function?.name === 'view_file' || call.function?.name === 'multi_replace_file_content' || call.function?.name === 'replace_file_content') {
          const args = JSON.parse(call.function.arguments);
          if (args.TargetFile && args.TargetFile.includes('KnockoutBracket.tsx')) {
             if (args.ReplacementChunks) {
                console.log("Found ReplacementChunks for KnockoutBracket.tsx!");
                for (const chunk of args.ReplacementChunks) {
                   if (chunk.TargetContent.includes('export function KnockoutBracket')) {
                      fs.writeFileSync('C:\\Users\\Roandrinho\\Documents\\interseguro-projects\\MVP Polla Deportiva 2026\\original_bracket_snippet.txt', chunk.TargetContent);
                      console.log("Saved snippet!");
                   }
                }
             }
          }
        }
      }
    }
    // Also check tool outputs
    if (data.type === 'TOOL_RESPONSE' && data.content && data.content.includes('export function KnockoutBracket')) {
       // Could be output of view_file
       fs.writeFileSync('C:\\Users\\Roandrinho\\Documents\\interseguro-projects\\MVP Polla Deportiva 2026\\view_file_output.txt', data.content);
       console.log("Saved view_file output!");
    }
  } catch (e) {
    // ignore parse errors
  }
}
