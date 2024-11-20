import { useState, useEffect, useMemo, memo } from "react";
import axios from "axios";
import { Dropdown, Menu, Segment } from "semantic-ui-react";
import { url as baseUrl, token } from "../../../api";
import { queryClient } from "../../../utils/queryClient";
import ButtonMui from "@material-ui/core/Button";
import { TiArrowBack } from "react-icons/ti";
import { makeStyles } from "@material-ui/core";
import { toast } from "react-toastify";
import { Button } from "semantic-ui-react";
import { usePermissions } from "../../../hooks/usePermissions";
import { MenuItem } from "../../../reuseables/MenuItem"

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  transferOut: {
    pointerEvents: "none",
    opacity: 0.88,
  },
  disabled: {
    cursor: "not-allowed",
  },
}));

const SubMenu = (props) => {
  const { hasPermission, hasAnyPermission, loading } = usePermissions();
  const [activeItem, setActiveItem] = useState("recent-history");
  const patientObj = props.patientObj;
  const [isOtzEnrollementDone, setIsOtzEnrollementDone] = useState(null);
  const [labResult, setLabResult] = useState(null);
  const patientCurrentStatus = patientObj?.currentStatus === "Died (Confirmed)";
  const [isPatientActive, setIsPatientActive] = useState(
    !patientObj?.currentStatus?.toLowerCase()?.includes("stop")
  );

  // Memoized permission checks
  const permissions = useMemo(
    () => ({
      canSeeInitialEvaluation:
        hasAnyPermission(
          "Adult Initial Clinical Evaluation",
          "Pediatric Initial Clinical Evaluation Form"
        ) && !patientObj.clinicalEvaluation,

      canSeeCareAndSupport: hasAnyPermission(
        "Care and Support register",
        "Care and support checklist"
      ),

      canSeeLaboratory: hasAnyPermission(
        "Laboratory Order and Results Form",
        "Viral Load Order and Result Form",
        "Viral Load Monitoring Register"
      ),

      canSeeCareCard: hasPermission("Care Card"),

      canSeePharmacy: hasPermission("Combined Pharmacy Order Form"),

      canSeeEAC: hasPermission("EAC Monitoring Register"),

      canSeeCervicalCancer: (() => {
        const isFemale = patientObj.sex?.toUpperCase() === "FEMALE";
        return (
          isFemale &&
          hasAnyPermission(
            "Cervical cancer screening form",
            "Cervical cancer care Register",
            "Cervical cancer consent form",
            "Cervical cancer care card"
          )
        );
      })(),

      canSeeTracking: hasPermission("Client Tracking & Discontinuation Form"),

      canSeeTransfer: hasPermission("HIV Care and Treatment Transfer Form"),
    }),
    [hasPermission, hasAnyPermission, patientObj]
  );

  // Menu state conditions
  const menuConditions = useMemo(
    () => ({
      isInitialMenu:
        (patientObj.commenced === false ||
          patientObj.createBy.toUpperCase() !==
            "LAMIS DATA MIGRATION SYSTEM") &&
        (patientObj.commenced !== true ||
          patientObj.clinicalEvaluation !== true),

      isDeadOrTransferred:
        patientObj.currentStatus === "DIED (CONFIRMED)" ||
        patientObj.currentStatus === "ART TRANSFER OUT",

      canShowOTZ:
        (patientObj?.age >= 10 && patientObj?.age <= 23) ||
        patientObj.age <= 19,

      canShowOTZEnrollment: patientObj?.age >= 10 && patientObj?.age <= 23,

      showPediatricChecklist: patientObj.age <= 19,
    }),
    [patientObj]
  );



  useEffect(() => {
    const initializeData = async () => {
      if (patientObj?.id) {
        await Promise.all([
          getOldRecordIfExists(),
          getCurrentLabResult(patientObj.id),
          Observation(),
        ]);
      }
    };
    initializeData();
  }, [patientObj?.id]);

  const Observation = async () => {
    try {
      await axios.get(`${baseUrl}observation/person/${patientObj.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Observation error:", error);
    }
  };

  const getCurrentLabResult = async (id) => {
    try {
      const { data } = await axios.get(
        `${baseUrl}laboratory/vl-results/patients/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.length > 0) {
        setLabResult(data[data.length - 1]);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.apierror?.message ||
        "Something went wrong, please try again";
      toast.error(errorMessage);
    }
  };

  const getOldRecordIfExists = async () => {
    try {
      const { data: patientDTO } = await axios.get(
        `${baseUrl}observation/person/${patientObj?.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const otzData = patientDTO?.find?.(
        (item) => item?.type === "Service OTZ"
      );
      setIsOtzEnrollementDone(!!otzData);
    } catch (error) {
      setIsOtzEnrollementDone(false);
    }
  };

  const updateCurrentEnrollmentStatus = async () => {
    try {
      const response = await axios.post(
        `${baseUrl}hiv/status/activate-stop_status/${patientObj.personUuid}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 204) {
        setIsPatientActive(true);
        toast.success("Patient reactivated successfully");
        props.setActiveContent({
          ...props.activeContent,
          route: "recent-history",
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.apierror?.message ||
        "Something went wrong, please try again";
      toast.error(errorMessage);
    }
  };

  // prevent unnecessary re-renders
  const menuHandlers = useMemo(
    () => ({
      onClickHome: () => {
        setActiveItem("home");
        props.setActiveContent({
          ...props.activeContent,
          route: "recent-history",
        });
      },

      loadAdultEvaluation: () => {
        setActiveItem("initial");
        props.setActiveContent({
          ...props.activeContent,
          route: "adult-evaluation",
        });
      },

      loadArtCommencement: () => {
        setActiveItem("art");
        props.setActiveContent({
          ...props.activeContent,
          route: "art-commencementPage",
        });
      },

      loadPatientHistory: () => {
        setActiveItem("history");
        props.setActiveContent({
          ...props.activeContent,
          route: "patient-history",
        });
      },

      loadChronicCare: () => {
        setActiveItem("chronic-care");
        props.setActiveContent({
          ...props.activeContent,
          route: "chronic-care",
          activeTab: "home",
        });
      },

      onClickConsultation: () => {
        setActiveItem("visit");
        props.setActiveContent({
          ...props.activeContent,
          route: "consultation",
          activeTab: "home",
        });
      },

      loadPharmacyModal: () => {
        setActiveItem("pharmacy");
        props.setActiveContent({
          ...props.activeContent,
          route: "pharmacy",
          activeTab: "drug-refill",
        });
      },

      loadLaboratoryOrderResult: () => {
        setActiveItem("lab");
        props.setActiveContent({
          ...props.activeContent,
          route: "laboratoryOrderResult",
          activeTab: "labOrder",
        });
      },

      loadLaboratoryViralLoadOrderResult: () => {
        setActiveItem("lab");
        props.setActiveContent({
          ...props.activeContent,
          route: "laboratoryViralLoadOrderResult",
          activeTab: "viralLoad",
        });
      },

      loadEAC: () => {
        setActiveItem("eac");
        props.setActiveContent({
          ...props.activeContent,
          route: "counseling",
          activeTab: "home",
        });
      },

      loadCervicalCancer: () => {
        setActiveItem("cancer");
        props.setActiveContent({
          ...props.activeContent,
          route: "cervical-cancer",
        });
      },

      loadTrackingForm: () => {
        setActiveItem("tracking");
        props.setActiveContent({
          ...props.activeContent,
          route: "tracking-form",
          activeTab: "home",
        });
      },

      loadTransferForm: () => {
        setActiveItem("transfer");
        props.setActiveContent({
          ...props.activeContent,
          route: "transfer-form",
        });
      },

      loadIntensiveForm: () => {
        setActiveItem("intensive");
        props.setActiveContent({
          ...props.activeContent,
          route: "intensive-followup",
        });
      },

      clientVerificationForm: () => {
        setActiveItem("client-verfication-form");
        props.setActiveContent({
          ...props.activeContent,
          route: "client-verfication-form",
        });
      },

      DsdServiceForm: () => {
        setActiveItem("dsd-service-form");
        props.setActiveContent({
          ...props.activeContent,
          route: "dsd-service-form",
        });
      },

      loadOtzServiceForm: () => {
        queryClient.invalidateQueries();
        refetch();
        setActiveItem("otz-service-form");
        props.setActiveContent({
          ...props.activeContent,
          ...props.expandedPatientObj,
          route: "otz-service-form",
          actionType: "create",
        });
      },

      loadOtzEnrollmentForm: () => {
        queryClient.invalidateQueries();
        refetch();
        setActiveItem("otz-enrollment-form");
        props.setActiveContent({
          ...props.activeContent,
          ...props.expandedPatientObj,
          currentLabResult: labResult,
          route: "otz-enrollment-form",
          actionType: "create",
        });
      },

      loadOtzCheckList: () => {
        setActiveItem("otz-peadiatric-disclosure-checklist");
        props.setActiveContent({
          ...props.activeContent,
          route: "otz-peadiatric-disclosure-checklist",
          actionType: "create",
        });
      },
    }),
    [props.activeContent, props.expandedPatientObj, labResult]
  );

  return (
    <div>
      {patientObj && (
        <Segment inverted>
          {menuConditions.isInitialMenu ? (
            <Menu size="tiny" color="blue" inverted pointing>
              <MenuItem
                onClick={menuHandlers.onClickHome}
                name="home"
                active={activeItem === "recent-history"}
                title="Home"
              >
                Home
              </MenuItem>

              {permissions.canSeeInitialEvaluation && (
                <MenuItem
                  onClick={menuHandlers.loadAdultEvaluation}
                  name="initial"
                  active={activeItem === "initial"}
                  title="Initial Evaluation"
                >
                  Initial Evaluation
                </MenuItem>
              )}

              {!patientObj.commenced && (
                <MenuItem
                  onClick={menuHandlers.loadArtCommencement}
                  name="art"
                  active={activeItem === "art"}
                  title="Art Commencement"
                >
                  Art Commencement
                </MenuItem>
              )}

              <MenuItem
                onClick={menuHandlers.loadPatientHistory}
                name="history"
                active={activeItem === "history"}
                title="History"
              >
                History
              </MenuItem>
            </Menu>
          ) : (
            <>
              {menuConditions.isDeadOrTransferred ? (
                <Menu
                  size="tiny"
                  style={{
                    backgroundColor: "rgb(153, 46, 98)",
                    color: "#fff",
                  }}
                  inverted
                >
                  <MenuItem
                    onClick={menuHandlers.onClickHome}
                    name="home"
                    active={activeItem === "recent-history"}
                    title="Home"
                  >
                    Home
                  </MenuItem>

                  {patientObj.currentStatus === "DIED (CONFIRMED)" &&
                    permissions.canSeeTracking && (
                      <MenuItem
                        onClick={menuHandlers.loadTrackingForm}
                        name="tracking"
                        active={activeItem === "tracking"}
                        title="Tracking Form"
                      />
                    )}

                  <MenuItem
                    onClick={menuHandlers.loadPatientHistory}
                    name="history"
                    active={activeItem === "history"}
                    title="History"
                  >
                    History
                  </MenuItem>

                  {patientObj.currentStatus === "ART TRANSFER OUT" &&
                    permissions.canSeeTracking && (
                      <MenuItem
                        onClick={menuHandlers.loadTransferForm}
                        name="transfer"
                        active={activeItem === "transfer"}
                        title="Transfer"
                      >
                        <Button
                          size="mini"
                          style={{
                            backgroundColor: "green",
                            color: "#fff",
                            marginRight: "10px",
                          }}
                        >
                          Activate
                        </Button>
                      </MenuItem>
                    )}
                </Menu>
              ) : (
                <Menu size="tiny" color="black" inverted>
                  <MenuItem
                    onClick={menuHandlers.onClickHome}
                    disabled={patientCurrentStatus}
                    name="home"
                    active={activeItem === "recent-history"}
                    title="Home"
                  >
                    Home
                  </MenuItem>

                  {isPatientActive && (
                    <>
                      {permissions.canSeeInitialEvaluation &&
                        patientObj.createBy.toUpperCase() ===
                          "LAMIS DATA MIGRATION SYSTEM" && (
                          <MenuItem
                            onClick={menuHandlers.loadAdultEvaluation}
                            name="initial"
                            active={activeItem === "initial"}
                            title="Initial Evaluation"
                          >
                            Initial Evaluation
                          </MenuItem>
                        )}

                      {permissions.canSeeCareAndSupport && (
                        <MenuItem
                          onClick={menuHandlers.loadChronicCare}
                          name="chronic care"
                          active={activeItem === "chronic-care"}
                        >
                          Care & Support
                        </MenuItem>
                      )}

                      {permissions.canSeeCareCard && (
                        <MenuItem
                          onClick={menuHandlers.onClickConsultation}
                          disabled={patientCurrentStatus}
                          name="visit"
                          active={activeItem === "visit"}
                          title="Care Card"
                        >
                          Care Card
                        </MenuItem>
                      )}

                      {permissions.canSeeLaboratory && (
                        <Menu.Menu
                          position=""
                          name="lab"
                          active={activeItem === "lab"}
                        >
                          <Dropdown item text="Laboratory">
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={menuHandlers.loadLaboratoryOrderResult}
                                disabled={patientCurrentStatus}
                                title="Laboratory Order & Result"
                              >
                                Laboratory Order & Result
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={
                                  menuHandlers.loadLaboratoryViralLoadOrderResult
                                }
                                disabled={patientCurrentStatus}
                                title="Viral Load Order & Result"
                              >
                                Viral Load Order & Result
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </Menu.Menu>
                      )}

                      {permissions.canSeePharmacy && (
                        <MenuItem
                          onClick={menuHandlers.loadPharmacyModal}
                          disabled={patientCurrentStatus}
                          name="pharmacy"
                          active={activeItem === "pharmacy"}
                          title="Pharmacy"
                        >
                          Pharmacy
                        </MenuItem>
                      )}

                      {permissions.canSeeEAC && (
                        <MenuItem
                          onClick={menuHandlers.loadEAC}
                          disabled={patientCurrentStatus}
                          name="eac"
                          active={activeItem === "eac"}
                          title="EAC"
                        >
                          EAC
                        </MenuItem>
                      )}

                      {permissions.canSeeCervicalCancer && (
                        <MenuItem
                          onClick={menuHandlers.loadCervicalCancer}
                          name="cancer"
                          active={activeItem === "cancer"}
                          title="Cervical Cancer"
                        >
                          Cervical Cancer
                        </MenuItem>
                      )}

                      {permissions.canSeeTracking && (
                        <Menu.Menu
                          position=""
                          name="lab"
                          active={activeItem === "lab"}
                        >
                          <Dropdown item text="Other Forms">
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={menuHandlers.loadTrackingForm}
                                name="tracking"
                                active={activeItem === "tracking"}
                                title="Tracking Form"
                              >
                                Tracking Form
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={menuHandlers.loadIntensiveForm}
                                name="intensive"
                                active={activeItem === "intensive"}
                                title="Intensive Follow Up"
                              >
                                Intensive Follow Up
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={menuHandlers.clientVerificationForm}
                                name="clientVerificationForm"
                                active={activeItem === "clientVerificationForm"}
                                title="Client Verification Form"
                              >
                                Client Verification Form
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={menuHandlers.DsdServiceForm}
                                name="DsdServiceForm"
                                active={activeItem === "DsdServiceForm"}
                                title="DSD ASSESSMENT AND ACCEPTANCE FORM"
                              >
                                Dsd Service Form
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>

                          {menuConditions.canShowOTZ && (
                            <Dropdown item text="OTZ">
                              <Dropdown.Menu>
                                {menuConditions.canShowOTZEnrollment && (
                                  <>
                                    {isOtzEnrollementDone === null ? (
                                      <Dropdown.Item>
                                        Checking patient enrollment...
                                      </Dropdown.Item>
                                    ) : !isOtzEnrollementDone ? (
                                      <Dropdown.Item
                                        onClick={
                                          menuHandlers.loadOtzEnrollmentForm
                                        }
                                        name="OTZ Enrollment Form"
                                        active={
                                          activeItem === "otz-enrollment-form"
                                        }
                                        title="Enrollment Form"
                                      >
                                        OTZ Enrollment Form
                                      </Dropdown.Item>
                                    ) : (
                                      <Dropdown.Item
                                        onClick={
                                          menuHandlers.loadOtzServiceForm
                                        }
                                        name="OTZ Service Form"
                                        active={
                                          activeItem === "otz-service-form"
                                        }
                                        title="Tracking Form"
                                      >
                                        OTZ Service Form
                                      </Dropdown.Item>
                                    )}
                                  </>
                                )}

                                {menuConditions.showPediatricChecklist && (
                                  <Dropdown.Item
                                    onClick={menuHandlers.loadOtzCheckList}
                                    name="Peadiatric Disclosure Checklist"
                                    active={
                                      activeItem ===
                                      "otz-peadiatric-disclosure-checklist"
                                    }
                                    title="Peadiatric Disclosure Checklist"
                                  >
                                    Peadiatric Disclosure Checklist
                                  </Dropdown.Item>
                                )}
                              </Dropdown.Menu>
                            </Dropdown>
                          )}
                        </Menu.Menu>
                      )}

                      {permissions.canSeeTransfer && (
                        <MenuItem
                          onClick={menuHandlers.loadTransferForm}
                          name="transfer"
                          active={activeItem === "transfer"}
                          title="Transfer"
                        >
                          Transfer
                        </MenuItem>
                      )}
                    </>
                  )}

                  <MenuItem
                    onClick={menuHandlers.loadPatientHistory}
                    name="history"
                    active={activeItem === "history"}
                    title="History"
                  >
                    History
                  </MenuItem>

                  {!isPatientActive && (
                    <ButtonMui
                      onClick={updateCurrentEnrollmentStatus}
                      variant="contained"
                      color="primary"
                      className="float-end ms-2 mr-2 mt-2"
                      startIcon={<TiArrowBack />}
                      style={{
                        backgroundColor: "green",
                        color: "#fff",
                        height: "35px",
                      }}
                    >
                      <span style={{ textTransform: "capitalize" }}>
                        Reactivate
                      </span>
                    </ButtonMui>
                  )}
                </Menu>
              )}
            </>
          )}
        </Segment>
      )}
    </div>
  );
};
export default memo(SubMenu);
