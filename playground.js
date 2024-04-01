const axios = require('axios')

async function playground(
  {
    prompt = '',
    data = {
      prompt_negative: '',
      width: 1024,
      height: 1024,
      guidance_scale: 3,
    },
  },
  process
) {
  try {
    axios
      .post(
        'https://nexra.aryahcr.cc/api/image/complements',
        {
          prompt: prompt != undefined && prompt != null ? prompt : '',
          model: 'playground',
          data: {
            prompt_negative:
              data != undefined &&
              data != null &&
              data.prompt_negative != undefined &&
              data.prompt_negative != null
                ? data.prompt_negative
                : '',
            width:
              data != undefined &&
              data != null &&
              data.width != undefined &&
              data.width != null
                ? data.width
                : 1024,
            height:
              data != undefined &&
              data != null &&
              data.height != undefined &&
              data.height != null
                ? data.height
                : 1024,
            guidance_scale:
              data != undefined &&
              data != null &&
              data.guidance_scale != undefined &&
              data.guidance_scale != null
                ? data.guidance_scale
                : 3,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then(response => {
        if (response.status === 200) {
          if (
            (typeof response.data).toString().toLowerCase() ===
            'Object'.toLowerCase()
          ) {
            if (
              response.data.code != undefined &&
              response.data.code != null &&
              response.data.code === 200 &&
              response.data.status != undefined &&
              response.data.status != null &&
              response.data.status === true
            ) {
              return process(null, response.data)
            } else {
              return process(response.data, null)
            }
          } else {
            let js = null
            let count = -1
            for (let i = 0; i < response.data.length; i++) {
              if (count <= -1) {
                if (response.data[i] === '{') {
                  count = i
                }
              } else {
                break
              }
            }

            if (count <= -1) {
              return process(
                {
                  code: 500,
                  status: false,
                  error: 'INTERNAL_SERVER_ERROR',
                  message: 'general (unknown) error',
                },
                null
              )
            } else {
              try {
                js = response.data.slice(count)
                js = JSON.parse(js)
                if (
                  js != undefined &&
                  js != null &&
                  js.code != undefined &&
                  js.code != null &&
                  js.code === 200 &&
                  js.status != undefined &&
                  js.status != null &&
                  js.status === true
                ) {
                  return process(null, js)
                } else {
                  return process(js, null)
                }
              } catch (e) {
                return process(
                  {
                    code: 500,
                    status: false,
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'general (unknown) error',
                  },
                  null
                )
              }
            }
          }
        } else {
          return process(response.data, null)
        }
      })
      .catch(error => {
        try {
          if (error.response) {
            return process(error.response.data, null)
          } else if (error.request) {
            return process(
              {
                code: 404,
                error: 'NOT_FOUND',
                message: 'the service is currently unavailable',
              },
              null
            )
          } else {
            return process(
              {
                code: 500,
                status: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'general (unknown) error',
              },
              null
            )
          }
        } catch (e) {
          return process(
            {
              code: 500,
              status: false,
              error: 'INTERNAL_SERVER_ERROR',
              message: 'general (unknown) error',
            },
            null
          )
        }
      })
  } catch (e) {
    return process(
      {
        code: 500,
        status: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'general (unknown) error',
      },
      null
    )
  }
}

module.exports = playground
