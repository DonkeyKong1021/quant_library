import Editor from '@monaco-editor/react'
import { Box } from '@mui/material'
import { useThemeMode } from '../contexts/ThemeContext'

export default function StrategyEditor({ code, onChange, height = '500px', readOnly = false }) {
  const { isDark } = useThemeMode()

  const handleEditorChange = (value) => {
    if (onChange && value !== undefined) {
      onChange(value)
    }
  }

  return (
    <Box 
      sx={{ 
        width: '100%', 
        border: 'none',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: isDark 
          ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
          : '0 1px 3px rgba(0, 0, 0, 0.12)',
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)',
        transition: 'all 0.2s ease',
        padding: 1,
        '&:hover': {
          boxShadow: isDark
            ? '0 4px 12px rgba(0, 0, 0, 0.4)'
            : '0 2px 6px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <Editor
        height={height}
        language="python"
        value={code || ''}
        onChange={handleEditorChange}
        theme={isDark ? 'vs-dark' : 'vs-light'}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
          fontLigatures: true,
          wordWrap: 'on',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          roundedSelection: false,
          padding: { top: 16, bottom: 16, left: 12, right: 12 },
          lineHeight: 21,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          quickSuggestions: true,
        }}
      />
    </Box>
  )
}
