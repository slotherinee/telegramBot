const { dalle, prodia, emi, stablediffusion } = require("gpti");
const playground = require("./playground");

const modelsData = [
  {
    name: "/dalle",
    modelFn: dalle.v1,
    optionalData: null,
  },
  {
    name: "/prodia",
    modelFn: prodia.v1,
    optionalData: {
      model: "absolutereality_v181.safetensors [3d9d4d2b]",
      steps: 25,
      cfg_scale: 7,
      sampler: "DPM++ 2M Karras",
      negative_prompt: "",
    },
  },
  {
    name: "/emi",
    modelFn: emi,
    optionalData: null,
  },
  {
    name: "/diffusion",
    modelFn: stablediffusion.v2,
    optionalData: {
      prompt_negative: "",
      guidance_scale: 9,
    },
  },
  {
    name: "/xlprodia",
    modelFn: prodia.stablediffusion,
    optionalData: {
      prompt_negative: "",
      model: "absolutereality_v181.safetensors [3d9d4d2b]",
      sampling_method: "DPM++ 2M Karras",
      sampling_steps: 25,
      width: 1024,
      height: 1024,
      cfg_scale: 7,
    },
  },
  {
    name: "/xxlprodia",
    modelFn: prodia.stablediffusion,
    optionalData: {
      prompt_negative: "",
      model: "cyberrealistic_v33.safetensors [82b0d085]",
      sampling_method: "DPM++ 2M Karras",
      sampling_steps: 25,
      width: 1024,
      height: 1024,
      cfg_scale: 7,
    },
  },
  {
    name: "/real",
    modelFn: prodia.v1,
    optionalData: {
      model: "Realistic_Vision_V5.0.safetensors [614d1063]",
      steps: 25,
      cfg_scale: 7,
      sampler: "DPM++ 2M Karras",
      negative_prompt: "",
    },
  },
  {
    name: "/journey",
    modelFn: prodia.v1,
    optionalData: {
      model: "openjourney_V4.ckpt [ca2f377f]",
      steps: 25,
      cfg_scale: 7,
      sampler: "DPM++ 2M Karras",
      negative_prompt: "",
    },
  },
  {
    name: "/cyber",
    modelFn: prodia.v1,
    optionalData: {
      model: "cyberrealistic_v33.safetensors [82b0d085]",
      steps: 25,
      cfg_scale: 7,
      sampler: "DPM++ 2M Karras",
      negative_prompt: "",
    },
  },
  {
    name: "/mini",
    modelFn: dalle.mini,
    optionalData: null,
  },
  {
    name: "/pg",
    modelFn: playground,
    optionalData: {
      width: 1024,
      height: 1024,
      prompt: "",
      scheduler: "DPMSolver++",
      num_outputs: 1,
      guidance_scale: 3,
      apply_watermark: true,
      negative_prompt: "",
      prompt_strength: 0.8,
      num_inference_steps: 25,
    },
  },
];

module.exports = modelsData;
