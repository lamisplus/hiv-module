import React, {useState, useEffect} from 'react';
import { Card,CardBody, FormGroup, Label, Input} from 'reactstrap';
import MatButton from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import SaveIcon from '@material-ui/icons/Save'
import ButtonMui from "@material-ui/core/Button";
import CancelIcon from '@material-ui/icons/Cancel'
import axios from "axios";
import { toast} from "react-toastify";
import { url as baseUrl } from "../../../api";
import { token as token } from "../../../api";
import "react-widgets/dist/css/react-widgets.css";
import moment from "moment";
import { Spinner } from "reactstrap";
import { Icon,Button, } from 'semantic-ui-react'
import FirstEAC from './EnhancedAdherenceCounseling';
import ContinueEAC from './SecondEac';

const useStyles = makeStyles(theme => ({
    card: {
        margin: theme.spacing(20),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(3)
    },
    submit: {
        margin: theme.spacing(3, 0, 2)
    },
    cardBottom: {
        marginBottom: 20
    },
    Select: {
        height: 45,
        width: 350
    },
    button: {
        margin: theme.spacing(1)
    },

    root: {
        '& > *': {
            margin: theme.spacing(1)
        }
    },
    input: {
        display: 'none'
    } 
}))

const EAC = (props) => {
    //const patientObj = props.patientObj;
    const classes = useStyles()
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true)
    const [objValues, setObjValues]=useState({
                                                currentRegimen: "",
                                                planAction:"",
                                                eacId: "",
                                                id: "",
                                                outComeDate: "",
                                                outcome: "",
                                                repeatViralLoader:"",
                                                personId: props.patientObj.id,
                                                plan: "",
                                                visitId: "",
                                                switchRegimen:""
                                            })
    const [switchs, setSwitchs]=useState({
            currentRegimen: "",
            switchRegimen: "",
            dateSwitched: "",
            reasonSwitched: "",
            
        })
    const [Substitutes, setSubstitutes]=useState({
        reasonSubstituted: "",
        substituteRegimen: "",
        dateSubstituted: "",
        reasonSwitched: "",
        
    })  
    useEffect(() => {
        EACHistory()
    }, [props.patientObj.id]);
    ///GET LIST OF EAC
    const EACHistory =()=>{
        setLoading(true)
        axios
            .get(`${baseUrl}hiv/eac/out-come?eacId=${props.activeContent.obj.id}`,
                { headers: {"Authorization" : `Bearer ${token}`} }
            )
            .then((response) => {
            setLoading(false)
            setObjValues(response.data)
            })
            .catch((error) => {
            //console.log(error);
            });    
    }
    const handleInputSwitchChange = e => {
        setSwitchs ({...switchs,  [e.target.name]: e.target.value});
    }
    const handleInputSubstituteChange = e => {
        setSubstitutes ({...Substitutes,  [e.target.name]: e.target.value});
    } 
    const handleInputChange = e => {
        setObjValues ({...objValues,  [e.target.name]: e.target.value});
    }    
    const BackToSession = (row, actionType) =>{  
        // props.setActiveContent({...props.activeContent, route:'pharmacy', activeTab:"hsitory"})
         props.setActiveContent({...props.activeContent, route:'eac-session', id:row.id, activeTab:"history", actionType:actionType, obj:row})
     }       
    /**** Submit Button Processing  */
    const handleSubmit = (e) => {        
        e.preventDefault();        
          setSaving(true);
          objValues.status='Third'
          axios.post(`${baseUrl}observation/eac`,objValues,
           { headers: {"Authorization" : `Bearer ${token}`}},
          
          )
              .then(response => {
                  setSaving(false);
                  toast.success("EAC outcome Save successful");
                  props.setActiveContent({...props.activeContent, route:'eac-session'})

              })
              .catch(error => {
                setSaving(false);
                if(error.response && error.response.data){
                    let errorMessage = error.response.data.apierror && error.response.data.apierror.message!=="" ? error.response.data.apierror.message :  "Something went wrong, please try again";
                    toast.error(errorMessage);
                  }
                  else{
                    toast.error("Something went wrong. Please try again...");
                  }
              });
          
    }

  return (      
        <div>  
                          
            <Card >
                <CardBody>

                <form >
                    <div className="row">
                    <h2>EAC - Outcome 
                    <ButtonMui
                        variant="contained"
                        color="primary"
                        className=" float-end ms-2 mr-2 mt-2 "
                        //startIcon={<FaUserPlus size="10"/>}
                        //startIcon={<TiArrowBack  />}
                        onClick={BackToSession}
                        style={{backgroundColor:"#014D88", color:'#fff', height:'35px'}}

                        >
                            <span style={{ textTransform: "capitalize" }}>Back To EAC Session</span>
                    </ButtonMui>
                    </h2>
                        <br/>
                        <br/>
                        <br/>
                        
                        <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                <Label >Repeat Viral Load Result</Label>
                                <Input
                                    type="text"
                                    name="viralLoadResult"
                                    id="viralLoadResult"
                                    style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                    
                               />
                                 
                                </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                            <Label for="">Date Result Recieved </Label>
                            <Input
                                type="date"
                                name="dateResultReceived"
                                id="dateResultReceived"
                                value={objValues.dateResultReceived}
                                //onChange={handleInputChange}
                                //min={objValues.dateOfEac2}
                                //max= {moment(new Date()).format("YYYY-MM-DD") }
                                style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                disabled
                            />
                           </FormGroup> 
                        </div>
                        <hr/>
                        <h3>Outcome</h3>
                        <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                <Label >Outcome </Label>
                                <Input
                                    type="select"
                                    name="outcome"
                                    id="outcome"
                                    value={objValues.outcome}
                                    onChange={handleInputChange}
                                    style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}                                    
                                >
                                 <option value="">Select</option> 
                                 <option value="Suppressed">Suppressed</option> 
                                 <option value="Unsuppressed">Unsuppressed</option>                                  
                                </Input>
                                  
                                </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                <Label >Plan </Label>
                                <Input
                                    type="select"
                                    name="plan"
                                    id="plan"
                                    value={objValues.plan}
                                    onChange={handleInputChange}
                                    style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                    
                                >
                                 <option value="">Select</option> 
                                 <option value="Remain on current regimen">Remain on current regimen</option> 
                                 <option value="Switch regimen">Switch regimen</option> 
                                 <option value="Substitute regimen">Substitute regimen</option>
                                 <option value="Refer to doctor for further management">Refer to doctor for further management</option>                               
                                </Input>                                 
                                </FormGroup>
                        </div>
                        {objValues.plan==='Switch regimen' && (<>
                        <div className="row">
                        <h4>Switch Regimen</h4>
                        <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                <Label >Current Regimen </Label>
                                <Input
                                    type="text"
                                    name="currentRegimen"
                                    id="currentRegimen"
                                    value={objValues.currentRegimen}
                                    onChange={handleInputChange}
                                    disabled
                                    style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                    
                                /> 
                                </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                <Label >Switch Regimen </Label>
                                <Input
                                    type="select"
                                    name="switchRegimen"
                                    id="switchRegimen"
                                    value={objValues.switchRegimen}
                                    onChange={handleInputSwitchChange}
                                    disabled
                                    style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                    
                                >
                                 <option value="">Select</option> 

                                </Input>
                                  
                                </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                            <Label for="">Switch Date</Label>
                            <Input
                                type="date"
                                name="dateSwitched"
                                id="dateSwitched"
                                value={objValues.dateSwitched}
                                onChange={handleInputSwitchChange}
                                min= {moment(objValues.dateOfLastViralLoad).format("YYYY-MM-DD") }
                                max= {moment(new Date()).format("YYYY-MM-DD") }
                                style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                required
                            />
                            {errors.dateSwitched !=="" ? (
                                <span className={classes.error}>{errors.dateSwitched}</span>
                            ) : "" }
                            </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                            <Label for="">Reason for switching Regimen</Label>
                            <Input
                                type="textarea"
                                name="reasonSwitched"
                                id="reasonSwitched"
                                value={objValues.reasonSwitched}
                                onChange={handleInputSwitchChange}
                                style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                            />
                            </FormGroup>
                        </div>
                        
                        </div>
                        </>)}
                        {objValues.plan==='Substitute regimen' && (<>
                        <div className="row">
                        <h4>Substitute Regimen</h4>
                        <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                <Label >Current Regimen </Label>
                                <Input
                                    type="text"
                                    name="currentRegimen"
                                    id="currentRegimen"
                                    value={objValues.currentRegimen}
                                     onChange={handleInputChange}
                                    disabled
                                    style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                    
                                />
                                
                                  
                                </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                <Label >Substitute Regimen </Label>
                                <Input
                                    type="select"
                                    name="substituteRegimen"
                                    id="substituteRegimen"
                                    value={objValues.substituteRegimen}
                                    onChange={handleInputSubstituteChange}
                                    disabled
                                    style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                    
                                >
                                 <option value="">Select</option> 
                                 

                                </Input>
                                  
                                </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                            <Label for="">Substitute Date</Label>
                            <Input
                                type="date"
                                name="dateSubstituted"
                                id="dateSubstituted"
                                value={objValues.dateSubstituted}
                                onChange={handleInputSubstituteChange}
                                min= {moment(objValues.dateOfLastViralLoad).format("YYYY-MM-DD") }
                                max= {moment(new Date()).format("YYYY-MM-DD") }
                                style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                required
                            />
                            {errors.dateSubstituted !=="" ? (
                                <span className={classes.error}>{errors.dateSubstituted}</span>
                            ) : "" }
                            </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                            <Label for="">Reason for Substitute Regimen</Label>
                            <Input
                                type="textarea"
                                name="reasonSubstituted"
                                id="reasonSubstituted"
                                value={objValues.reasonSubstituted}
                                onChange={handleInputSubstituteChange}
                                style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                            />
                            </FormGroup>
                        </div>
                        
                        </div>
                        </>)}
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                            <Label for="">Outcome Date</Label>
                            <Input
                                type="date"
                                name="outComeDate"
                                id="outComeDate"
                                value={objValues.outComeDate}
                                onChange={handleInputChange}
                                min= {moment(objValues.dateOfLastViralLoad).format("YYYY-MM-DD") }
                                max= {moment(new Date()).format("YYYY-MM-DD") }
                                style={{border: "1px solid #014D88", borderRadius:"0.25rem"}}
                                required
                            />
                            {errors.outComeDate !=="" ? (
                                <span className={classes.error}>{errors.outComeDate}</span>
                            ) : "" }
                            </FormGroup>
                        </div>   
                        </div>
                        
                    
                    {saving ? <Spinner /> : ""}
                    <br />
                
                    <MatButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    startIcon={<SaveIcon />}
                    onClick={handleSubmit}
                    style={{backgroundColor:"#014d88"}}
                    disabled={objValues.dateOfEac3==="" ? true : false}
                    >
                    {!saving ? (
                    <span style={{ textTransform: "capitalize" }}>Save</span>
                    ) : (
                    <span style={{ textTransform: "capitalize" }}>Saving...</span>
                    )}
                    </MatButton>
                    </form>
                </CardBody>
            </Card>                    
        </div>
  );
}

export default EAC;
