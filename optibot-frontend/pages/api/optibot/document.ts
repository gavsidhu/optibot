import { removeCodeBlockWrappers } from '@/utils/helpers';
import { NextApiHandler } from 'next';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const openai = new OpenAIApi(configuration);

const Document: NextApiHandler = async (req, res) => {
    const { selectedText } = req.body;
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful coding assistant that helps document code. You generate inline documentation that can be read by documentation generators.',
        },
        {
          role: 'user',
          content:
            'Can you rewrite the following code with inline documentation using documentation syntax. Return the documented code without any additional text:\n' +
            selectedText,
        },
      ],
    });
    res
      .status(200)
      .json({ content: removeCodeBlockWrappers(completion.data?.choices[0].message?.content as string) });
  } catch (error) {
    console.log(error);
  }
};

export default Document;
