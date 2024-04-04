const Replicate = require("replicate");

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const playground = async ({ prompt, optionalData }, process) => {
  try {
    const output = await replicate.run(
      "playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24",
      {
        input: {
          ...optionalData,
          prompt,
        },
      }
    );
    await process(null, output);
  } catch (error) {
    await process(error, null);
  }
};

module.exports = playground;
