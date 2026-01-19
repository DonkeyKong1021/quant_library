import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material'
import PreviewIcon from '@mui/icons-material/Preview'
import { getAllTemplates } from '../utils/strategyTemplates'
import StrategyEditor from './StrategyEditor'

export default function StrategyTemplates({ onSelectTemplate }) {
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const templates = getAllTemplates()

  const handleTemplateClick = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template.code)
    }
  }

  const handlePreviewClick = (e, template) => {
    e.stopPropagation()
    setPreviewTemplate(template)
  }

  return (
    <>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose a template to get started quickly
        </Typography>

        <Grid container spacing={2}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} key={template.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardActionArea onClick={() => handleTemplateClick(template)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                        {template.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handlePreviewClick(e, template)}
                          sx={{ p: 0.5 }}
                          title="Preview code"
                        >
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                        <Chip 
                          label="Template" 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ flexShrink: 0 }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {template.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Preview Dialog */}
      <Dialog 
        open={!!previewTemplate} 
        onClose={() => setPreviewTemplate(null)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          {previewTemplate?.name}
          <Chip 
            label="Template Preview" 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {previewTemplate?.description}
          </Typography>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
            <StrategyEditor 
              code={previewTemplate?.code || ''} 
              readOnly={true}
              height="500px"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
          <Button 
            onClick={() => {
              if (previewTemplate && onSelectTemplate) {
                onSelectTemplate(previewTemplate.code)
              }
              setPreviewTemplate(null)
            }} 
            variant="contained"
          >
            Use Template
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
