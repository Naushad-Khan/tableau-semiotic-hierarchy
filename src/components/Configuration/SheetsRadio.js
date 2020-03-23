import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

const styles = theme => ({
  formControl: {
    margin: theme.spacing.unit * 3,
  },
  group: {
    margin: `${theme.spacing.unit}px 0`,
  },
  button: {
    margin: theme.spacing.unit,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
  iconSmall: {
    fontSize: 20,
  },
  radio: {
    '&$checked': {
      color: 'rgb(232, 118, 44)'
    }
  },
  checked: {}
});

class RadioButtonsGroup extends React.Component {
  constructor (props) {
    super(props);
    console.log('props', this.props);
    this.state = {
      value: this.props.selectedValue || ""
    };
  }

  // handleChange = event => {
  //   this.setState({ value: event.target.value });
  // };

  handleClick = event => {
    console.log('handleClick', this.props.field, event.target.value);
    if ( event.target.value ) {
      this.props.sheetCallBack(this.props.field, event.target.value);
    }
    if ( this.props.customChange ) {
      this.props.customChange(event);
    }
  }


  componentWillUpdate(nextProps, nextState) {
    // if we get a new field, reset value to existing tableau setting
    if (this.props.field !== nextProps.field || this.state.value !== nextProps.selectedValue) {
      console.log('sheetRadioUpdate', this.props, this.state);
      this.setState({
        value: nextProps.selectedValue || ""
      })
    }
  }
  
  render() {
    const { classes, sheets, title } = this.props;

    // const changeCallBack = customChange || this.handleChange;

    console.log('sheetRadio', this.props, this.state);
    return (
      <div className={classes.root}>
        <div>
          <FormControl component="fieldset" required className={classes.formControl}>
            <FormLabel component="legend">{title}</FormLabel>
            <RadioGroup
              className={classes.group}
              value={this.state.value}
              onChange={this.handleClick}
            >
            {sheets.map(sheetName => (
              <FormControlLabel
                key={sheetName}
                value={sheetName}
                control={<Radio color="primary" classes={{root: classes.radio, checked: classes.checked}} />}
                label={sheetName}
              />
            ))}
            </RadioGroup>
            {/* <FormHelperText>You can display an error</FormHelperText> */}
          </FormControl>
        </div>
      {/* <div>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          className={classes.button}
          onClick={this.handleClick}
        >
          <Save className={classNames(classes.leftIcon, classes.iconSmall)} />
          Save
        </Button>
      </div> */}
    </div>
    );
  }
}

RadioButtonsGroup.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(RadioButtonsGroup);
