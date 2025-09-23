package com.grad.social.service.status;

import com.grad.social.repository.status.StatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StatusService {
    private final StatusRepository statusRepository;
}
