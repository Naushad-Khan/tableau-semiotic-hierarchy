import React from 'react';
import PropTypes from 'prop-types';

//material ui
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

//sheets radio
import RadioButtonsGroup from './SheetsRadio';

const styles = {
  root: {
    flexGrow: 1
  }
};

function ConfigScreen(props) {
  const {
    selectSheet,
    sheetNames,
    configTitle,
    listTitle, 
    field,
    selectedValue } = props;

  console.log('configScreen', props);
  return (
    <React.Fragment>
      <div className="sheetScreen" style={{padding : 10, paddingBottom: 100 }}>
        <Grid
          container
          alignItems="center"
          justify="space-between"
          direction="row"
          spacing={8} >


          <Grid item xs={12} >
            <Typography
              variant="display1"
              align="left" >
              {configTitle}
            </Typography>
          </Grid>

          <Grid item xs={6} >
            <div className="SheetPicker" >
              <RadioButtonsGroup
                sheets={sheetNames}
                title={listTitle}
                sheetCallBack={selectSheet}
                field={field}
                selectedValue={selectedValue}
              />
            </div>
          </Grid>
          <Grid item xs={6} >
            <Grid
              container
              alignItems="stretch"
              justify="space-between"
              direction="column"
              spacing={8} >
              {/*
              <Grid item xs={12}>
                <Paper>
                  <Typography
                    variant="display2"
                    align="left" >
                    Data
                  </Typography>
                </Paper>
              </Grid>

              <Grid item style={{ height:'25%' }}>
                <Paper>
                  <Typography
                    variant="subheading"
                    align="center" >
                    Drop sheet with data here
                  </Typography>
                </Paper>
              </Grid>
              */}
              {/* left off here, the chord is still not sized dynamically */}
              {/* <Grid item xs={12} >
                <Paper>
                  <Typography
                    variant="subheading"
                    align="center" >
                    Placeholder for help info
                  </Typography>
                </Paper>
              </Grid> */}
            </Grid>
          </Grid>
        </Grid>
      </div>
    </React.Fragment>
    );
}

ConfigScreen.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ConfigScreen);
