const { prodia, emi } = require("gpti")
const {
    render3d,
    pixelart,
    anima,
    dalle,
    playground,
    diffusion,
    pseudoJourney
} = require("./modelFn")

const modelsData = [
    {
        name: "/dalle",
        modelFn: dalle,
        optionalData: {
            guidance_scale: 6,
            negative_prompt: "",
            num_inference_steps: 25,
            height: 1024,
            width: 1024,
            style: "natural"
        }
    },
    {
        name: "/prodia",
        modelFn: prodia.v1,
        optionalData: {
            model: "absolutereality_v181.safetensors [3d9d4d2b]",
            steps: 25,
            cfg_scale: 7,
            sampler: "DPM++ 2M Karras",
            negative_prompt: ""
        }
    },
    {
        name: "/emi",
        modelFn: emi,
        optionalData: null
    },
    {
        name: "/diffusion",
        modelFn: diffusion,
        optionalData: {
            prompt_negative: "",
            guidance_scale: 7.5,
            image_style: "Photographic",
            height: 1024,
            width: 1024
        }
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
            cfg_scale: 7
        }
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
            cfg_scale: 7
        }
    },
    {
        name: "/real",
        modelFn: prodia.v1,
        optionalData: {
            model: "Realistic_Vision_V5.0.safetensors [614d1063]",
            steps: 25,
            cfg_scale: 7,
            sampler: "DPM++ 2M Karras",
            negative_prompt: ""
        }
    },
    {
        name: "/journey",
        modelFn: pseudoJourney,
        optionalData: {
            guidance_scale: 7.5,
            negative_prompt: "",
            sampler: "DPM++ 2M Karras",
            steps: 25,
            height: 1024,
            width: 1024
        }
    },
    {
        name: "/cyber",
        modelFn: prodia.v1,
        optionalData: {
            model: "cyberrealistic_v33.safetensors [82b0d085]",
            steps: 25,
            cfg_scale: 7,
            sampler: "DPM++ 2M Karras",
            negative_prompt: ""
        }
    },
    {
        name: "/anime",
        modelFn: prodia.v1,
        optionalData: {
            model: "dreamlike-anime-1.0.safetensors [4520e090]",
            steps: 25,
            cfg_scale: 7,
            sampler: "DPM++ 2M Karras",
            negative_prompt: ""
        }
    },
    {
        name: "/render",
        modelFn: render3d,
        optionalData: {
            prompt_negative: ""
        }
    },
    {
        name: "/pixelart",
        modelFn: pixelart,
        optionalData: {
            negative_prompt: "3d render, realistic",
            num_inference_steps: 8,
            guidance_scale: 1.5,
            height: 1024,
            width: 1024
        }
    },
    {
        name: "/anima",
        modelFn: anima,
        optionalData: {
            negative_prompt:
                "lowres, text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]",
            guidance_scale: 7,
            num_inference_steps: 28,
            width: 1024,
            height: 1024
        }
    },
    {
        name: "/pg",
        modelFn: playground,
        optionalData: {
            guidance_scale: 3,
            prompt_negative: "",
            width: 1024,
            height: 1024
        }
    }
]

module.exports = modelsData
