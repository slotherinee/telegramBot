require("dotenv").config();
const { HfInference } = require("@huggingface/inference");
const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

const generateImage = async (
  { prompt, optionalData, model: modelName },
  process
) => {
  try {
    const result = await hf.textToImage({
      inputs: prompt,
      model: modelName,
      parameters: optionalData,
    });
    process(null, result);
  } catch (error) {
    process(error, null);
  }
};

const models = {
  "goofyai/3d_render_style_xl": "render3d",
  "nerijs/pixel-art-xl": "pixelart",
  "cagliostrolab/animagine-xl-3.1": "anima",
  "ehristoforu/dalle-3-xl-v2": "dalle",
  "playgroundai/playground-v2-1024px-aesthetic": "playground",
  "stabilityai/stable-diffusion-xl-base-1.0": "diffusion",
  "ptx0/pseudo-journey-v2": "pseudoJourney",
};

Object.entries(models).forEach(([modelName, modelFn]) => {
  module.exports[modelFn] = async ({ prompt, optionalData }, process) =>
    generateImage({ prompt, optionalData, model: modelName }, process);
});
