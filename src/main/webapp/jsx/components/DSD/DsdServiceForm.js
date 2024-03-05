import React, {useState, useEffect} from "react";
import {Card, CardBody, FormGroup, Label, Input, Button, Spinner} from "reactstrap";

import {makeStyles} from "@material-ui/core/styles";
import axios from "axios";
import {toast} from "react-toastify";
import {url as baseUrl} from "../../../api";
import {token as token} from "../../../api";
import "react-widgets/dist/css/react-widgets.css";
import moment from "moment";
import "react-dual-listbox/lib/react-dual-listbox.css";
import Select from "@mui/material/Select";
import {useTheme} from "@mui/material/styles";
import {Label as LabelRibbon, Message} from "semantic-ui-react";
import MatButton from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/Save";

const useStyles = makeStyles((theme) => ({
    card: {
        margin: theme.spacing(20), display: "flex", flexDirection: "column", alignItems: "center",
    }, form: {
        width: "100%", // Fix IE 11 issue.
        marginTop: theme.spacing(3),
    }, submit: {
        margin: theme.spacing(3, 0, 2),
    }, cardBottom: {
        marginBottom: 20,
    }, Select: {
        height: 45, width: 350,
    }, button: {
        margin: theme.spacing(1),
    },

    root: {
        flexGrow: 1, "& .card-title": {
            color: "#fff", fontWeight: "bold",
        }, "& .form-control": {
            borderRadius: "0.25rem", height: "41px",
        }, "& .card-header:first-child": {
            borderRadius: "calc(0.25rem - 1px) calc(0.25rem - 1px) 0 0",
        }, "& .dropdown-toggle::after": {
            display: " block !important",
        }, "& select": {
            "-webkit-appearance": "listbox !important",
        }, "& p": {
            color: "red",
        }, "& label": {
            fontSize: "14px", color: "#014d88", fontWeight: "bold",
        },
    }, input: {
        display: "none",
    }, error: {
        color: "#f85032", fontSize: "11px",
    },
}));

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250,
        },
    },
};

function getStyles(name, selectedOptions, theme) {
    return {
        fontWeight: selectedOptions.indexOf(name) === -1 ? theme.typography.fontWeightRegular : theme.typography.fontWeightMedium,
    };
}

const DsdServiceForm = (props) => {
    const theme = useTheme();
    const patientObj = props.patientObj;
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    let temp = {...errors};
    const classes = useStyles();
    const [setting, setSetting] = useState([]);
    const [dsdModelType, setDsdModelType] = useState([]);
    const [facId, setFacId] = useState(localStorage.getItem("facId"))


    const [payload, setPayLoad] = useState({
        personId: patientObj && patientObj.id ? patientObj.id : "",
        viralLoadTestResult: "",
        viralLoadTestResultDate: "",
        dsdEligible: "",
        dsdAccept: "",
        dsdModel: "",
        dsdType: "",
        comment: "",
        completedBy: "",
        designation: "",
        dateDevolved: "",
        score: "",
        facilityId: facId ? facId : "",
        dsdEligibilityAssessment: {
            onArtForAtLeast1Year: "",
            goodUnderstandingOfAdherence: "",
            clinicallyStableNoOpportunisticInfections: "",
            noADRRequireRegularMonitoring: "",
            evidenceOfTreatmentSuccess: "",
            mostRecentVLWithin6Months: "",
            currentRegimenGreaterThan6Months: "",
            completedTBPreventiveTherapy: "",
            doesNotHaveTBCoInfection: "",
            notPregnant: "",
            notBreastfeeding: "",
            noChildOnArtLessThan3YearsOld: "",
            hasNoComorbidities: ""
        }
    });

    useEffect(() => {
        console.log("patientObj", patientObj);
    }, []);
    // get dsd model type
    function DsdModelType(dsdmodel) {
        const dsd =
            dsdmodel === "Facility" ? "DSD_MODEL_FACILITY" : "DSD_MODEL_COMMUNITY";
        axios
            .get(`${baseUrl}application-codesets/v2/${dsd}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                setDsdModelType(response.data);
            })
            .catch((error) => {});
    }

    // /api/v1/hiv/art/pharmacy/devolve/current-viral-load
    const getViralLoadAndDate = () => {
        axios.get(`${baseUrl}hiv/art/pharmacy/devolve/current-viral-load?personId=${patientObj.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((response) => {
                console.log(response.data);
                const {viralLoadTestResult, viralLoadTestResultDate } = response.data;

                const dateObject = new Date(viralLoadTestResultDate);

                // Format the date object as desired (e.g., YYYY-MM-DD)
                const formattedDate = dateObject.toISOString().split('T')[0];
                setPayLoad({
                    ...payload,
                    viralLoadTestResult: viralLoadTestResult,
                    viralLoadTestResultDate: formattedDate
                });
            })
            .catch((error) => {
                // console.error(error);
            });
    }


    useEffect(() => {
        getViralLoadAndDate();
    }, []);

    // Method to calculate DSD Eligibility assessment score
    const getEligibilityAssessmentScore = () => {
        let score = 0;
        for (let key in payload.dsdEligibilityAssessment) {
            if (payload.dsdEligibilityAssessment[key] === "Yes") {
                score += 1;
            }
        }
        return score;
    }

    useEffect(() => {
        const score = getEligibilityAssessmentScore();
        setPayLoad(prevState => ({
            ...prevState,
            score: score,
            dsdEligible: (
                props.patientObj.sex?.toLowerCase() === "male" && score >= 11 ||
                props.patientObj.sex?.toLowerCase() === "female" && score >= 13
            ) ? "Yes" : "No"
            //
        }));
        // if the the score changes and is below 11 for male and above below 13 for female, then the
        //dsdModel shoule be empty, dsdType should be empty and dsdAccept should be empty
        if (score < 11 || score < 13) {
            setPayLoad(prevState => ({
                ...prevState,
                dsdModel: "",
                dsdType: "",
                dsdAccept: ""
            }))
        }
    }, [payload.dsdEligibilityAssessment, props.patientObj.sex]);


    const submitAssessmentForm = (load) => {
        axios
            .post(`${baseUrl}hiv/art/pharmacy/devolve`, load, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                setSaving(false);
                toast.success("DSD Assesment Submitted Successfully");
                props.setActiveContent({
                    ...props.activeContent,
                    route: "recent-history",
                });
            })
            .catch((error) => {
                setSaving(false);
                if (error.response && error.response.data) {
                    let errorMessage =
                        error.response.data && error.response.data.apierror.message !== ""
                            ? error.response.data.apierror.message
                            : "Something went wrong, please try again";
                    toast.error(errorMessage);
                }
            });
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        temp[name] = ""; // Reset the error for this field
        setPayLoad(prevPayload => ({
            ...prevPayload,
            dsdEligibilityAssessment: {
                ...prevPayload.dsdEligibilityAssessment,
                [name]: value
            }
        }));
    };

    // console.log("payload", payload);

    // handle for dsdModel,dsdAccept, dsdType, viralLoadOrderResult, viralLoadOrderDate,
    const handleOtherInputChange = (e) =>{
        const { name, value } = e.target;
        if (name === "dsdModel" && value !== "") {
            DsdModelType(value);
            setPayLoad({ ...payload, [name]: value });
        }
        if (name === "dsdAccept" && value !== "Yes") {
            setPayLoad({ ...payload, dsdModel: "",dsdType: "", dsdAccept: value });
        }
        setPayLoad(prevPayload => ({
            ...prevPayload,
            [name]: value
        }))

    }


    const handleSubmit = (e) => {
        e.preventDefault();

        if (validate()) {
            submitAssessmentForm(payload);
            // console.log("payload", payload);
            // setSaving(true);
            console.log("form submitted successfully")
        } else {
            window.scroll(0, 0);
        }
    };

    /*****  Validation  */
    const validate = () => {
        // var temp = { ...errors}
        temp ={};
        temp.onArtForAtLeast1Year = payload.dsdEligibilityAssessment.onArtForAtLeast1Year ? "" : "This field is required.";
        temp.goodUnderstandingOfAdherence = payload.dsdEligibilityAssessment.goodUnderstandingOfAdherence ? "" : "This field is required.";
        temp.clinicallyStableNoOpportunisticInfections = payload.dsdEligibilityAssessment.clinicallyStableNoOpportunisticInfections ? "" : "This field is required.";
        temp.noADRRequireRegularMonitoring = payload.dsdEligibilityAssessment.noADRRequireRegularMonitoring ? "" : "This field is required.";
        temp.evidenceOfTreatmentSuccess = payload.dsdEligibilityAssessment.evidenceOfTreatmentSuccess ? "" : "This field is required.";
        temp.mostRecentVLWithin6Months = payload.dsdEligibilityAssessment.mostRecentVLWithin6Months ? "" : "This field is required.";
        temp.currentRegimenGreaterThan6Months = payload.dsdEligibilityAssessment.currentRegimenGreaterThan6Months ? "" : "This field is required.";
        temp.completedTBPreventiveTherapy = payload.dsdEligibilityAssessment.completedTBPreventiveTherapy ? "" : "This field is required.";
        temp.doesNotHaveTBCoInfection = payload.dsdEligibilityAssessment.doesNotHaveTBCoInfection ? "" : "This field is required.";
        temp.dateDevolved = payload.dateDevolved ? "" : "This field is required.";


        temp.noChildOnArtLessThan3YearsOld = payload.dsdEligibilityAssessment.noChildOnArtLessThan3YearsOld ? "" : "This field is required.";
        temp.hasNoComorbidities = payload.dsdEligibilityAssessment.hasNoComorbidities ? "" : "This field is required.";


        if (props.patientObj && props.patientObj?.sex?.toLowerCase() == "female"){
            temp.notPregnant = payload.dsdEligibilityAssessment.notPregnant ? "" : "This field is required.";
            temp.notBreastfeeding = payload.dsdEligibilityAssessment.notBreastfeeding ? "" : "This field is required.";
        }

        if(payload.dsdEligible && payload.dsdEligible === "Yes"  && payload.dsdAccept && payload.dsdAccept === "Yes") {
            temp.dsdModel = payload.dsdModel ? "" : "This field is required.";
            temp.dsdType = payload.dsdType ? "" : "This field is required.";
        }
        // the field dsd accept should be required if the field dsd eligible is yes
        if(payload.dsdEligible && payload.dsdEligible === "Yes" && payload.dsdAccept === ""){
            temp.dsdAccept = "This field is required.";
        }
        setErrors({...temp});
        return Object.values(temp).every((x) => x === "");
    };


    return (<>
        <Card className={classes.root}>
            <CardBody>
                <h2 style={{color: "#000"}}> DSD ASSESSMENT AND ACCEPTANCE FORM </h2>
                <br/>
                <form>
                    <div class="row">
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    On ART for at least 1 year?{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input
                                    type="select"
                                    name="onArtForAtLeast1Year"
                                    id="onArtForAtLeast1Year"
                                    value={payload.dsdEligibilityAssessment.onArtForAtLeast1Year}
                                    onChange={handleInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                >
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.onArtForAtLeast1Year !== "" ? (<span className={classes.error}>
                        {errors.onArtForAtLeast1Year}
                      </span>) : ("")}
                            </FormGroup>
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Adherence with good understanding of lifelong adherence?{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input
                                    type="select"
                                    name="goodUnderstandingOfAdherence"
                                    id="goodUnderstandingOfAdherence"
                                    value={payload.dsdEligibilityAssessment.goodUnderstandingOfAdherence}
                                    onChange={handleInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                >
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.goodUnderstandingOfAdherence !== "" ? (<span className={classes.error}>
                        {errors.goodUnderstandingOfAdherence}
                      </span>) : ("")}
                            </FormGroup>
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Clinically stable with no opportunistic infections?{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input
                                    type="select"
                                    name="clinicallyStableNoOpportunisticInfections"
                                    id="clinicallyStableNoOpportunisticInfections"
                                    value={payload.dsdEligibilityAssessment.clinicallyStableNoOpportunisticInfections}
                                    onChange={handleInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                >
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.clinicallyStableNoOpportunisticInfections !== "" ? (
                                    <span className={classes.error}>
                        {errors.clinicallyStableNoOpportunisticInfectionsn}
                      </span>) : ("")}
                            </FormGroup>
                        </div>


                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Have no ADR that require regular monitoring?{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input type="select" name="noADRRequireRegularMonitoring"
                                       id="noADRRequireRegularMonitoring"
                                       value={payload.dsdEligibilityAssessment.noADRRequireRegularMonitoring}
                                       onChange={handleInputChange}
                                       style={{border: "1px solid #014D88", borderRadius: "0.25rem"}}>

                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.noADRRequireRegularMonitoring !== "" ? (<span className={classes.error}>
                        {errors.noADRRequireRegularMonitoringn}
                      </span>) : ("")}
                            </FormGroup>
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Evidence of treatment success – 2 successive VL
                                    measurements {"<"} 1000copies/ml?{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input type="select"
                                       name="evidenceOfTreatmentSuccess"
                                       id="evidenceOfTreatmentSuccess"
                                       value={payload.dsdEligibilityAssessment.evidenceOfTreatmentSuccess}
                                       onChange={handleInputChange}
                                       style={{border: "1px solid #014D88", borderRadius: "0.25rem"}}>
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.evidenceOfTreatmentSuccess !== "" ? (<span className={classes.error}>
                        {errors.evidenceOfTreatmentSuccess}
                        </span>) : ("")}
                            </FormGroup>
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Most recent VL less than or equal to 6 months?{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input type="select"
                                       name="mostRecentVLWithin6Months"
                                       id="mostRecentVLWithin6Months"
                                       value={payload.dsdEligibilityAssessment.mostRecentVLWithin6Months}
                                       onChange={handleInputChange}
                                       style={{border: "1px solid #014D88", borderRadius: "0.25rem"}}>
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.mostRecentVLWithin6Months !== "" ? (<span className={classes.error}>
                        {errors.mostRecentVLWithin6Months}
                        </span>) : ("")}
                            </FormGroup>
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Is on a current regimen for greater than 6 months?{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input type="select"
                                       name="currentRegimenGreaterThan6Months"
                                       id="currentRegimenGreaterThan6Months"
                                       value={payload.dsdEligibilityAssessment.currentRegimenGreaterThan6Months}
                                       onChange={handleInputChange}

                                       style={{border: "1px solid #014D88", borderRadius: "0.25rem"}}>
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.currentRegimenGreaterThan6Months !== "" ? (<span className={classes.error}>
                        {errors.currentRegimenGreaterThan6Months}
                        </span>) : ("")}
                            </FormGroup>
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Has completed TB Preventive Therapy (TPT){" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input
                                    type="select"
                                    name="completedTBPreventiveTherapy"
                                    id="completedTBPreventiveTherapy"
                                    value={payload.dsdEligibilityAssessment.completedTBPreventiveTherapy}
                                    onChange={handleInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                >
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.completedTBPreventiveTherapy !== "" ? (<span className={classes.error}>
                        {errors.completedTBPreventiveTherapy}
                      </span>) : ("")}
                            </FormGroup>
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Does not have TB co-infection?{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input
                                    type="select"
                                    name="doesNotHaveTBCoInfection"
                                    id="doesNotHaveTBCoInfection"
                                    value={payload.dsdEligibilityAssessment.doesNotHaveTBCoInfection}
                                    onChange={handleInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                >
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.doesNotHaveTBCoInfection !== "" ? (<span className={classes.error}>
                        {errors.doesNotHaveTBCoInfection}
                      </span>) : ("")}
                            </FormGroup>
                        </div>
                        {props.patientObj && props.patientObj.sex.toLowerCase() == "female" &&
                            <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                    <Label>
                                        {" "}
                                        Not Pregnant?{" "}
                                        <span style={{color: "red"}}> *</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        name="notPregnant"
                                        id="notPregrant"
                                        value={payload.dsdEligibilityAssessment.notPregnant}
                                        onChange={handleInputChange}
                                        style={{
                                            border: "1px solid #014D88", borderRadius: "0.25rem",
                                        }}
                                    >
                                        <option value=""> Select</option>
                                        <option value="Yes"> Yes</option>
                                        <option value="No"> No</option>
                                    </Input>
                                    {errors.notPregnant !== "" ? (<span className={classes.error}>
                        {errors.notPregnant}
                      </span>) : ("")}
                                </FormGroup>
                            </div>}

                        {props.patientObj && props.patientObj.sex.toLowerCase() == "female" &&
                            <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                    <Label>
                                        {" "}
                                        Not breastfeeding?{" "}
                                        <span style={{color: "red"}}> *</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        name="notBreastfeeding"
                                        id="notBreastfeeding"
                                        value={payload.dsdEligibilityAssessment.notBreastfeeding}
                                        onChange={handleInputChange}
                                        style={{
                                            border: "1px solid #014D88", borderRadius: "0.25rem",
                                        }}
                                    >
                                        <option value=""> Select</option>
                                        <option value="Yes"> Yes</option>
                                        <option value="No"> No</option>
                                    </Input>
                                    {errors.notBreastfeeding !== "" ? (<span className={classes.error}>
                        {errors.notBreastfeeding}
                      </span>) : ("")}
                                </FormGroup>
                            </div>}

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Does not have a child on ART less than 3 years old??{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input
                                    type="select"
                                    name="noChildOnArtLessThan3YearsOld"
                                    id="noChildOnArtLessThan3YearsOld"
                                    value={payload.dsdEligibilityAssessment.noChildOnArtLessThan3YearsOld}
                                    onChange={handleInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                >
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.noChildOnArtLessThan3YearsOld !== "" ? (<span className={classes.error}>
                        {errors.noChildOnArtLessThan3YearsOld}
                      </span>) : ("")}
                            </FormGroup>
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Has no
                                    co-morbiditie <span>{"(e.Heart dx,Chronic Liver Dx,Chronic Kidney Dx, DM)"} </span> ?{" "}
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input
                                    type="select"
                                    name="hasNoComorbidities"
                                    id="hasNoComorbidities"
                                    value={payload.dsdEligibilityAssessment.hasNoComorbidities}
                                    onChange={handleInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                >
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.hasNoComorbidities !== "" ? (<span className={classes.error}>
                        {errors.hasNoComorbidities}
                      </span>) : ("")}
                            </FormGroup>
                        </div>
                        <br/>
                        <Message warning>
                            <h4> DSD assessment score </h4>
                            <b>
                                Score : {payload.score}
                            </b>
                        </Message>
                        <hr/>
                    </div>

                    <div className="row">
                        <div
                            className="form-group  col-md-12 text-center pt-2 mb-4"
                            style={{
                                backgroundColor: "#992E62",
                                width: "125%",
                                height: "35px",
                                color: "#fff",
                                fontWeight: "bold",
                            }}
                        >
                            VL Test
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label for="firstName">
                                    VL Test Result (copies/ml)
                                </Label>
                                <Input
                                    className="form-control"
                                    type="text"
                                    name="viralLoadTestResult"
                                    id="viralLoadTestResult"
                                    value={payload.viralLoadTestResult}
                                    onChange={handleOtherInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.2rem",
                                    }}
                                    disabled
                                />
                            </FormGroup>
                        </div>

                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label for="">
                                    Date of VL test Result
                                </Label>
                                <Input
                                    type="date"
                                    name="viralLoadTestResultDate"
                                    id="viralLoadTestResultDate"
                                    value={payload.viralLoadTestResultDate}
                                    onChange={handleOtherInputChange}
                                    min="1929-12-31"
                                    max={moment(new Date()).format("YYYY-MM-DD")}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                    disabled
                                />

                            </FormGroup>
                        </div>

                    </div>

                    {payload.dsdEligible && payload.dsdEligible == "Yes" && <div className="row">
                        <div
                            className="form-group  col-md-12 text-center pt-2 mb-6"
                            style={{
                                backgroundColor: "#992E62",
                                width: "125%",
                                height: "35px",
                                color: "#fff",
                                fontWeight: "bold",
                            }}
                        >
                            Eligibility and Acceptance
                        </div>
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label>
                                    {" "}
                                    Eligible for
                                    DSD?
                                    <span style={{color: "red"}}> *</span>
                                </Label>
                                <Input
                                    type="select"
                                    name="dsdEligible"
                                    id="dsdEligible"
                                    value={payload.dsdEligible}
                                    onChange={handleOtherInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                    disabled
                                >
                                    <option value=""> Select</option>
                                    <option value="Yes"> Yes</option>
                                    <option value="No"> No</option>
                                </Input>
                                {errors.dsdEligible !== "" ? (<span className={classes.error}>
                        {errors.dsdEligible}
                      </span>) : ("")}
                            </FormGroup>
                        </div>
                        {payload.dsdEligible && payload.dsdEligible === "Yes" &&
                            <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                    <Label>
                                        {" "}
                                        Client accepts DSD?
                                        <span style={{color: "red"}}> *</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        name="dsdAccept"
                                        id="dsdAccept"
                                        value={payload.dsdAccept}
                                        onChange={handleOtherInputChange}
                                        style={{
                                            border: "1px solid #014D88", borderRadius: "0.25rem",
                                        }}
                                    >
                                        <option value=""> Select</option>
                                        <option value="Yes"> Yes</option>
                                        <option value="No"> No</option>
                                    </Input>
                                    {errors.dsdAccept !== "" ? (<span className={classes.error}>
                        {errors.dsdAccept}
                      </span>) : ("")}
                                </FormGroup>
                            </div>}

                    </div>}

                    {payload.dsdEligible && payload.dsdEligible === "Yes"  &&
                        payload.dsdAccept && payload.dsdAccept === "Yes" && <div className="row">
                            <div
                                className="form-group  col-md-12 text-center pt-2 mb-4"
                                style={{
                                    backgroundColor: "#992E62",
                                    width: "125%",
                                    height: "35px",
                                    color: "#fff",
                                    fontWeight: "bold",
                                }}
                            >
                                Client DSD Models
                            </div>

                            <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                    <Label>DSD Model <span style={{color: "red"}}> *</span></Label>
                                    <Input
                                        type="select"
                                        name="dsdModel"
                                        id="dsdModel"
                                        value={payload.dsdModel}
                                        onChange={handleOtherInputChange}
                                        style={{
                                            border: "1px solid #014D88",
                                            borderRadius: "0.25rem",
                                        }}
                                    >
                                        <option value="">Select</option>
                                        <option value="Facility">Facility</option>
                                        <option value="Community">Community</option>
                                    </Input>
                                    {errors.dsdModel !== "" ? (<span className={classes.error}>
                        {errors.dsdModel }
                      </span>) : ("")}
                                </FormGroup>
                            </div>
                            <div className="form-group mb-3 col-md-6">
                                <FormGroup>
                                    <Label>DSD Model Type<span style={{color: "red"}}> *</span></Label>
                                    <Input
                                        type="select"
                                        name="dsdType"
                                        id="dsdType"
                                        value={payload.dsdType}
                                        onChange={handleOtherInputChange}
                                        style={{
                                            border: "1px solid #014D88",
                                            borderRadius: "0.25rem",
                                        }}
                                    >
                                        <option value="">Select</option>
                                        {dsdModelType.map((value) => (
                                            <option key={value.code} value={value.code}>
                                                {value.display}
                                            </option>
                                        ))}
                                    </Input>
                                    {errors.dsdType !== "" ? (<span className={classes.error}>
                        {errors.dsdType}
                        </span>) : ("")}
                                </FormGroup>
                            </div>
                        </div>}
                    {/*comment, resignation, date section */}
                    <div className="row">
                        <div className="form-group mb-3 col-md-12">
                            <FormGroup>
                                <Label for="firstName">
                                    Comments
                                    {/* <span style={{ color: "red" }}> *</span> */}
                                </Label>
                                <Input
                                    className="form-control"
                                    type="textarea"
                                    rows="4"
                                    cols="7"
                                    name="comment"
                                    id="comment"
                                    value={payload.comment}
                                    onChange={handleOtherInputChange}
                                    style={{
                                        border: "1px solid #014D88",
                                        borderRadius: "0.2rem",
                                        height: "100px",
                                    }}
                                />
                            </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label for="firstName">
                                    Completed by {""}
                                </Label>
                                <Input
                                    className="form-control"
                                    type="text"
                                    name="completedBy"
                                    id="completedBy"
                                    value={payload.completedBy}
                                    onChange={handleOtherInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.2rem",
                                    }}
                                    // disabled
                                />
                            </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label for="firstName">
                                    Designation {""}
                                </Label>
                                <Input
                                    className="form-control"
                                    type="text"
                                    name="designation"
                                    id="designation"
                                    value={payload.designation}
                                    onChange={handleOtherInputChange}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.2rem",
                                    }}
                                    // disabled
                                />
                            </FormGroup>
                        </div>
                        <div className="form-group mb-3 col-md-6">
                            <FormGroup>
                                <Label for="">
                                    Date <span style={{color: "red"}}> *</span>{" "}
                                </Label>
                                <Input
                                    type="date"
                                    name="dateDevolved"
                                    id="dateDevolved"
                                    value={payload.dateDevolved}
                                    onChange={handleOtherInputChange}
                                    min="1929-12-31"
                                    max={moment(new Date()).format("YYYY-MM-DD")}
                                    style={{
                                        border: "1px solid #014D88", borderRadius: "0.25rem",
                                    }}
                                    // disabled
                                />
                                {errors.dateDevolved !== "" ? (<span className={classes.error}>
                        {errors.dateDevolved}
                        </span>) : ("")}
                            </FormGroup>
                        </div>
                    </div>


                </form>
                {/*{props.activeContent.actionType === "update" && (*/}
                <div>
                    {saving ? <Spinner/> : ""}
                    <br/>

                    <MatButton
                        type="button"
                        variant="contained"
                        color="primary"
                        className={classes.button}
                        startIcon={<SaveIcon/>}
                        onClick={handleSubmit}
                        style={{backgroundColor: "#014d88"}}
                        // disabled={objValues.dateOfEac1 === "" ? true : false}
                    >
                        {!saving ? (
                            <span style={{textTransform: "capitalize"}}>Save</span>
                        ) : (
                            <span style={{textTransform: "capitalize"}}>Saving...</span>
                        )}
                    </MatButton>
                </div>
                {/*)}*/}
            </CardBody>
        </Card>
    </>)
}
export default DsdServiceForm