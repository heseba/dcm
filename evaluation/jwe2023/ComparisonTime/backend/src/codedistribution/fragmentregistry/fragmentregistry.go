package fragmentregistry

import (
	"fmt"
	"os"
  "strings"

	"codedistribution/global"
	"codedistribution/models"
	"codedistribution/util"

	"gopkg.in/yaml.v2"
)

var fragmentList models.Fragments

// reduced variant for public
var fragmentStatusList models.FragmentStati

func GetFragmentList() *models.Fragments {
	return &fragmentList
}
func GetFragmentStatusList() *models.FragmentStati {
	return &fragmentStatusList
}

func preProcess(rawYaml *models.RawYaml, yamlData *models.YamlData) error {
	var fragment_name string;
	var code_name string;
	fragments := make([]models.Fragment, len(rawYaml.Fragments))
	id_map := make(map[string]int, len(rawYaml.Fragments))
	for i, frag := range rawYaml.Fragments {
		var id_actual int = i+1;
		if frag.ID != nil {
			fragment_name = *frag.ID;
		} else if frag.Name != nil {
			fragment_name = *frag.Name
		} else {
			return fmt.Errorf("Fragment is missing both ID and name!")
		}
		if frag.Name != nil {
			code_name = *frag.Name
		} else {
			code_name = fragment_name
		}
		f := models.Fragment {
			ID           : id_actual,
			Name         : code_name,
			FragName     : fragment_name,
			GlobalVar    : frag.GlobalVar,
			TypeDef      : frag.TypeDef,
			RunOn        : frag.RunOn,
			Location     : frag.Location,
			Dependencies : make([]int, len(frag.Dependencies)),
			Libs         : frag.Libs,
		}
		//fragments = append(fragments, f)
		fragments[i] = f
		id_map[fragment_name] = id_actual;
	}
	for i, frag := range fragments {
		if len(frag.Dependencies) == 0 {
			continue
		}
		for _, dependency := range rawYaml.Fragments[i].Dependencies {
			frag.Dependencies = append(frag.Dependencies, id_map[dependency])
		}
	}
//	fmt.Printf("%+v\n", fragments)
//	fmt.Printf("%p\n", yamlData)
//	yamlData = &models.YamlData {
//		Fragments: fragments,
//	}
	yamlData.Fragments = fragments
//	fmt.Printf("%p\n", yamlData)
	return nil
}


func fillFragmentList(yamlFile []byte) error {
	var rawYaml models.RawYaml
	var yamlData models.YamlData
	err := yaml.Unmarshal([]byte(yamlFile), &rawYaml)
	if err != nil {
		return fmt.Errorf("failed to unmarshal yaml data \nError: %s", err)
	}

	yamlData = models.YamlData {
		Fragments: nil,
	}
	err = preProcess(&rawYaml, &yamlData)
	if err != nil {
		return err
	}
	fmt.Printf("%+v\n", yamlData)

	// set default runOn location to 'client' if something abnormal is specified
	var validRunOnLocations []string = global.GetConfig().ValidRunOnLocations
	for i, frag := range yamlData.Fragments {
		if ok := util.IsStringInSlice(validRunOnLocations, frag.RunOn); !ok {
			yamlData.Fragments[i].RunOn = "client"
		}
	}

	// fill array with spread operator
	fragmentList = append(fragmentList, yamlData.Fragments...)

	return nil
}

func isPrivateToFile(str string) bool {
	return str[:1] == strings.ToLower(str[:1])
}

// create and copy only the necessary properties to share between frontend and backend
func fillFragmentStatusList() {
	for _, goFunction := range fragmentList {
		if !(goFunction.TypeDef ||
			goFunction.GlobalVar ||
			isPrivateToFile(goFunction.Name)) {
			fragmentStatusList = append(fragmentStatusList, models.FragmentStatus{
				ID:    goFunction.ID,
				Name:  goFunction.Name,
				RunOn: goFunction.RunOn,
			})
		}
	}
}

func New() error {

	var (
		cfdPath    string = ""
		yamlFile   []byte
		err        error             = nil
		moduleInfo global.ModuleInfo = *global.GetModuleInfo()
	)

	if util.FileExists(moduleInfo.ModulePath + "CFD.yaml") {
		cfdPath = moduleInfo.ModulePath + "CFD.yaml"
	} else if util.FileExists(moduleInfo.ModulePath + "CFD.yml") {
		cfdPath = moduleInfo.ModulePath + "CFD.yml"
	} else {
		return fmt.Errorf("couldn't find CFD.yaml or CDF.yml file")
	}

	yamlFile, err = os.ReadFile(cfdPath)
	if err != nil {
		return fmt.Errorf("couldn't open file '%s'\nError: %v ", cfdPath, err)
	}

	err = fillFragmentList(yamlFile)
	if err != nil {
		return err
	}

	fillFragmentStatusList()

	return nil
}
