package com.grad.social.common.exceptionhandling;

import lombok.Getter;

@Getter
public class ModelNotFoundException extends RuntimeException {

	private final Model model;

	private final Object modelId;

	public ModelNotFoundException(Model model, Object modelId) {
		super(model.name() + " with ID " + modelId + " not found");
		this.model = model;
		this.modelId = modelId;
	}

}