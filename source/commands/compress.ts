const compressCommand: BerkeliumCommand = {
  name: 'compress',
  description: 'Compress conversation memory into a summary to save tokens while retaining context',
  prompt: `I need to compress the current conversation memory to save tokens while retaining important context. Please use the compress_memory tool to:

1. Analyze the current conversation history
2. Create a comprehensive yet concise summary
3. Replace the full conversation history with the summary

The tool will automatically detect the current thread ID and handle the memory compression process.

Please use the compress_memory tool to compress this conversation.`
};

export default compressCommand;