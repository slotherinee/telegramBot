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

const mini = async ({ prompt, optionalData }, process) => {
  try {
    const output = await replicate.run(
      "lucataco/open-dalle-v1.1:1c7d4c8dec39c7306df7794b28419078cb9d18b9213ab1c21fdc46a1deca0144",
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

const pixart = async ({ prompt, optionalData }, process) => {
  try {
    const output = await replicate.run(
      "lucataco/pixart-xl-2:816c99673841b9448bc2539834c16d40e0315bbf92fef0317b57a226727409bb",
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

const dreamshaper = async ({ prompt, optionalData }, process) => {
  try {
    const output = await replicate.run(
      "lucataco/dreamshaper-xl-turbo:0a1710e0187b01a255302738ca0158ff02a22f4638679533e111082f9dd1b615",
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

module.exports = {
  playground,
  mini,
  pixart,
  dreamshaper,
};
