import ButtonBase from 'cozy-ui/transpiled/react/ButtonBase'
import { alpha, withStyles } from 'cozy-ui/transpiled/react/styles'

const styles = theme => ({
  root: {
    '&:hover': {
      textDecoration: 'none',
      backgroundColor: alpha(
        theme.palette.text.primary,
        theme.palette.action.hoverOpacity
      ),
      '@media (hover: none)': {
        backgroundColor: 'transparent'
      }
    }
  }
})

export default withStyles(styles)(ButtonBase)
