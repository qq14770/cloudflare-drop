import { useEffect, useState } from 'preact/hooks'
import { DialogProps } from '@toolpad/core/useDialogs'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
// import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import zh from 'dayjs/locale/zh-cn'
import { useDialogs } from '@toolpad/core/useDialogs'

import { fetchPlainText } from '../api'
import { copyToClipboard } from '../common'
import { BasicDialog } from './BasicDialog'

dayjs.extend(relativeTime)
dayjs.locale(zh)

export function FileDialog({
  open,
  onClose,
  payload,
}: DialogProps<
  FileType & {
    message: {
      error(message: string): void
      success(message: string): void
    }
  }
>) {
  const dialogs = useDialogs()
  const isText = payload.type === 'plain/string'
  const [text, updateText] = useState('')

  const handleCopy = (str: string) => {
    copyToClipboard(str)
      .then(() => {
        payload.message.success('复制成功')
      })
      .catch(() => {
        payload.message.success('复制失败')
      })
  }

  useEffect(() => {
    if (isText) {
      ;(async () => {
        const data = await fetchPlainText(payload.id)
        updateText(data)
      })()
    }
  }, [])

  const handleClose = async () => {
    if (!payload.is_ephemeral) {
      return onClose()
    }
    const confirmed = await dialogs.confirm('关闭后无法再次查看，确认关闭？', {
      okText: '确认',
      cancelText: '取消',
      title: '阅后即焚',
    })
    if (confirmed) {
      return onClose()
    }
  }

  return (
    <BasicDialog
      open={open}
      onClose={handleClose}
      title={isText ? '文本分享' : '文件分享'}
    >
      <Box>
        {isText && (
          <Box>
            <TextField
              multiline
              fullWidth
              rows={10}
              value={text}
              disabled
              sx={(theme) => ({
                '& .MuiInputBase-root': {
                  color: theme.palette.text.primary,
                },
                textarea: {
                  '-webkit-text-fill-color': 'currentColor !important',
                },
              })}
            />
            <Button
              variant="contained"
              onClick={() => handleCopy(text)}
              sx={(theme) => ({
                mt: 2,
                pl: 4,
                pr: 4,
                [theme.breakpoints.down('sm')]: {
                  width: '100%',
                },
              })}
            >
              复制
            </Button>
          </Box>
        )}
        {!isText && (
          <Box
            className="flex items-center justify-center w-full flex-col"
            sx={{ p: 2 }}
          >
            <Typography variant="caption">
              {payload.filename}
              {payload.size >= 0
                ? ` (${(payload.size / (1000 * 1000)).toFixed(1)}M)`
                : ''}
            </Typography>
            <Button
              variant="contained"
              href={`/files/${payload.id}`}
              sx={(theme) => ({
                mt: 1,
                pl: 4,
                pr: 4,
                width: 200,
                [theme.breakpoints.down('sm')]: {
                  width: '100%',
                },
              })}
            >
              下载
            </Button>
          </Box>
        )}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textDisabled">
            原始分享 SHA1 Hash 值{' '}
            <a target="_blank" href="https://www.lzltool.com/data-hash">
              (校验工具)
            </a>
            {'：'}
          </Typography>
          <Typography
            className="mt-1"
            variant="body2"
            onClick={() => handleCopy(payload.hash)}
          >
            {payload.hash}
          </Typography>
          <Typography className="mt-1" variant="body2" color="textDisabled">
            {payload.due_date ? '预计过期于：' : '永久有效'}
          </Typography>
          {payload.due_date && (
            <Typography className="mt-1" variant="body2">
              {dayjs(payload.due_date).fromNow()}
            </Typography>
          )}
        </Box>
      </Box>
    </BasicDialog>
  )
}
