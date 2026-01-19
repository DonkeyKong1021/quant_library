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
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import { getAllTemplates } from '../utils/strategyTemplates'

export default function StrategyTemplates({ onSelectTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const templates = getAllTemplates()

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template)
  }

  const handleUseTemplate = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate.code)
    }
    setSelectedTemplate(null)
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
                      <Chip 
                        label="Template" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ flexShrink: 0 }}
                      />
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

      <Dialog open={!!selectedTemplate} onClose={() => setSelectedTemplate(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTemplate?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedTemplate?.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Use Template" to load this template into the editor.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTemplate(null)}>Cancel</Button>
          <Button onClick={handleUseTemplate} variant="contained">
            Use Template
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
