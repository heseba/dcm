package websocket

import (
	"codedistribution/clientregistry"
	"codedistribution/fragmentregistry"
	"codedistribution/functionexecuter"
	"codedistribution/models"
	"encoding/json"
	"time"
)

func pingPong(ws *models.WebSocket) models.EventHandler {
	return func(e *models.Event) {

		// trigger the 'pingPong' event on the client
		ws.Out <- (&models.Event{
			Name:      "pingPong",
			Data:      "ping --- pong",
			Timestamp: time.Now().UnixMilli(),
		}).Raw()
	}
}

func updateFragmentList(ws *models.WebSocket) models.EventHandler {
	return func(e *models.Event) {
		var timestamp int64 = time.Now().UnixMilli()

		client, _ := clientregistry.GetClients().GetClientByUUID(ws.ClientID)

		// time.Sleep(2 * time.Second)

		// trigger the 'getFragmentList' event on the client
		ws.Out <- (&models.Event{
			Name:      "updateFragmentList",
			Data:      client.FragmentStatusList,
			Timestamp: timestamp,
		}).Raw()
	}
}

func callFunction(ws *models.WebSocket) models.EventHandler {
	var writeToWebsocket = func(functionName string, result interface{}) []byte {
		return (&models.Event{
			Name: "functionResult",
			Data: map[string]interface{}{
				"funcName": functionName,
				"result":   result,
			},
		}).Raw()
	}

	execute := func(function Function) {
		var (
			err     error
			results []interface{}
		)

		ch := make(chan models.ExecuteResult)

		if function.Name != "" {
			go functionexecuter.Execute(function.Name, function.Params, ch)
		} else {
			go functionexecuter.Execute(function.ID, function.Params, ch)
			fragment, err := fragmentregistry.GetFragmentList().GetFragmentById(function.ID)
			if err != nil {
				ch <- models.ExecuteResult{
					ByteData: nil,
					Err:      err,
				}
			} else {
				function.Name = fragment.Name
			}
		}

		for res := range ch {
			if res.Err != nil {
				ws.Out <- writeToWebsocket("__executionError", "couldn't execute function: "+res.Err.Error())
			}

			if err = json.Unmarshal(res.ByteData, &results); err != nil {
				ws.Out <- writeToWebsocket("__executionError", err.Error())
			}

			// trigger the 'functionResult' event on the client
			if len(results) == 1 {
				ws.Out <- writeToWebsocket(function.Name, results[0])
			} else {
				ws.Out <- writeToWebsocket(function.Name, results)
			}
		}
	}

	return func(e *models.Event) {
		var (
			function Function
			err      error
		)

		err = json.Unmarshal([]byte(e.Data.(string)), &function)
		if err != nil {
			ws.Out <- writeToWebsocket("__executionError", "couldn't execute function: "+err.Error())
			return
		}

		if function.Defer {
			go execute(function)
		} else {
			execute(function)
		}
	}
}
