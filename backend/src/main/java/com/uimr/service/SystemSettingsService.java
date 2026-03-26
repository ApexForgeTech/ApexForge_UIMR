package com.uimr.service;

import com.uimr.model.SystemSettings;
import com.uimr.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private final SystemSettingsRepository settingsRepository;

    public List<SystemSettings> getAllSettings() {
        return settingsRepository.findAll();
    }

    public SystemSettings updateSetting(String key, String value) {
        SystemSettings setting = settingsRepository.findByConfigKey(key)
                .orElse(SystemSettings.builder().configKey(key).build());
        setting.setConfigValue(value);
        return settingsRepository.save(setting);
    }

    public String getSettingValue(String key, String defaultValue) {
        return settingsRepository.findByConfigKey(key)
                .map(SystemSettings::getConfigValue)
                .orElse(defaultValue);
    }
}
