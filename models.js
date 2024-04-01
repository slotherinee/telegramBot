const {
  dalle,
  prodia,
  render3d,
  pixelart,
  emi,
  stablediffusion,
  pixart,
} = require('gpti')

const modelsData = [
  {
    name: '/dalle',
    modelFn: dalle.v2,
    optionalData: {
      gpu: false,
      prompt_improvement: false,
    },
  },
  {
    name: '/prodia',
    modelFn: prodia.v1,
    optionalData: {
      model: 'absolutereality_v181.safetensors [3d9d4d2b]',
      steps: 25,
      cfg_scale: 7,
      sampler: 'DPM++ 2M Karras',
      negative_prompt: '',
    },
  },
  {
    name: '/render',
    modelFn: render3d,
    optionalData: {
      prompt_negative: '',
    },
  },
  {
    name: '/pixelart',
    modelFn: pixelart,
    optionalData: {
      prompt_negative: '',
    },
  },
  {
    name: '/emi',
    modelFn: emi,
    optionalData: null,
  },
  {
    name: '/diffusion',
    modelFn: stablediffusion.xl,
    optionalData: {
      prompt_negative: '',
      image_style: '(No style)',
      guidance_scale: 7.5,
    },
  },
  {
    name: '/xlprodia',
    modelFn: prodia.stablediffusion,
    optionalData: {
      prompt_negative: '',
      model: 'absolutereality_v181.safetensors [3d9d4d2b]',
      sampling_method: 'DPM++ 2M Karras',
      sampling_steps: 25,
      width: 1024,
      height: 1024,
      cfg_scale: 7,
    },
  },
  {
    name: '/xxlprodia',
    modelFn: prodia.stablediffusion_xl,
    optionalData: {
      prompt_negative: '',
      model: 'sd_xl_base_1.0.safetensors [be9edd61]',
      sampling_method: 'DPM++ 2M Karras',
      sampling_steps: 25,
      width: 1024,
      height: 1024,
      cfg_scale: 7,
    },
  },
  {
    name: '/real',
    modelFn: prodia.v1,
    optionalData: {
      model: 'Realistic_Vision_V5.0.safetensors [614d1063]',
      steps: 25,
      cfg_scale: 7,
      sampler: 'DPM++ 2M Karras',
      negative_prompt: '',
    },
  },
  {
    name: '/journey',
    modelFn: prodia.v1,
    optionalData: {
      model: 'openjourney_V4.ckpt [ca2f377f]',
      steps: 25,
      cfg_scale: 7,
      sampler: 'DPM++ 2M Karras',
      negative_prompt: '',
    },
  },
  {
    name: '/cyber',
    modelFn: prodia.v1,
    optionalData: {
      model: 'cyberrealistic_v33.safetensors [82b0d085]',
      steps: 25,
      cfg_scale: 7,
      sampler: 'DPM++ 2M Karras',
      negative_prompt: '',
    },
  },
  {
    name: '/pixart',
    modelFn: pixart.a,
    optionalData: {
      prompt_negative: '',
      sampler: '(No style)',
      image_style: 'Anime',
      width: 1024,
      height: 1024,
      dpm_guidance_scale: 4.5,
      dpm_inference_steps: 14,
      sa_guidance_scale: 3,
      sa_inference_steps: 25,
    },
  },
  {
    name: '/mini',
    modelFn: dalle.mini,
    optionalData: null,
  },
]

module.exports = modelsData
