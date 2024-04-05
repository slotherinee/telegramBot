// require("dotenv").config();
// const { HfInference } = require("@huggingface/inference");
// const fs = require("fs");
// const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

// const main = async () => {
//   const classification = async () => {
//     const result = await hf.imageToImage({
//       inputs: new Blob([fs.readFileSync("6.jpg")]),
//       parameters: {
//         prompt: "add plate full of food on the table",
//       },
//       model: "lllyasviel/sd-controlnet-depth",
//     });
//     return result;
//   };
//   const result = await classification();
//   const buffer = Buffer.from(await result.arrayBuffer());
//   fs.writeFileSync("image.jpg", buffer);
//   console.log(buffer);
// };

// // const model = "ptx0/pseudo-journey-v2";

// // const main = async () => {
// //   const generateTextFromImage = async () => {
// //     const result = await hf.textToImage({
// //       inputs: "spider man",
// //       model,
// //       parameters: {
// //         guidance_scale: 7.5,
// //         negative_prompt: "",
// //         sampler: "DPM++ 2M Karras",
// //         steps: 25,
// //         // num_inference_steps: 25,
// //         height: 1024,
// //         width: 1024,
// //       },
// //     });
// //     return result;
// //   };

// //   const result = await generateTextFromImage();
// //   const buffer = Buffer.from(await result.arrayBuffer());
// //   fs.writeFileSync("image.jpg", buffer);
// //   console.log(result, buffer);
// // };

// main();
