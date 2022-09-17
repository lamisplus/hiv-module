package org.lamisplus.modules.hiv.controller;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lamisplus.modules.hiv.domain.dto.HIVEacDto;
import org.lamisplus.modules.hiv.domain.dto.HIVEacSessionDto;
import org.lamisplus.modules.hiv.service.HIVEacService;
import org.lamisplus.modules.hiv.service.HIVEacSessionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/hiv/eac")
public class EacController {
	
	private final HIVEacService hIVEacService;
	
	private final HIVEacSessionService hIVEacSessionService;
	
	
	@GetMapping(value = "/patient/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<List<HIVEacDto>> getPatientEacs(@PathVariable("id") Long id) {
		return ResponseEntity.ok(hIVEacService.getPatientEAcs(id));
	}
	
	@PutMapping(value = "/stop/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<HIVEacDto> stopEac(@PathVariable("id") Long id,
	                                         @RequestParam("reason") String reason) {
		return ResponseEntity.ok(hIVEacService.stopEac(id, reason));
	}
	
	
	@PostMapping(value = "/session", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<HIVEacSessionDto> registerEacSession(@RequestBody HIVEacSessionDto data) {
		return ResponseEntity.ok(hIVEacSessionService.createEacSession(data));
	}
	
	@GetMapping(value = "/session/eac/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<List<HIVEacSessionDto>> getSessionByEacId(@PathVariable("id") Long id) {
		return ResponseEntity.ok(hIVEacSessionService.getSessionByEac(id));
	}
	
	@PutMapping(value = "/session/edit/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<HIVEacSessionDto> updateEacSession(
			@PathVariable("id") Long id,
			HIVEacSessionDto data) {
		return ResponseEntity.ok(hIVEacSessionService.updateEacSession(id, data));
	}
	
	@DeleteMapping(value = "/delete/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<String> deleteEac(@PathVariable("id") Long id){
		hIVEacService.deleteEac(id);
		return ResponseEntity.ok("success");
	}
	@DeleteMapping(value = "session/delete/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<String> deleteEacSession(@PathVariable("id") Long id){
		hIVEacSessionService.deleteEacSessionById(id);
		return ResponseEntity.ok("success");
	}
	
	
}
