import Editor from '@monaco-editor/react'
import { Box } from '@mui/material'

export default function StrategyEditor({ code, onChange, height = '500px', readOnly = false }) {
  const handleEditorChange = (value) => {
    if (onChange && value !== undefined) {
      onChange(value)
    }
  }

  return (
    <Box sx={{ width: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Editor
        height={height}
        language="python"
        value={code || ''}
        onChange={handleEditorChange}
        theme="vs-light"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
        }}
      />
    </Box>
  )
}
