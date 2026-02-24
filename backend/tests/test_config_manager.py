import pytest
from pathlib import Path
from app.config.manager import ConfigManager
from app.config.models import AppConfiguration, DashboardConfig, ViewConfig, Section, CardItem


@pytest.fixture
def tmp_config(tmp_path):
    return ConfigManager(data_dir=tmp_path)


def test_load_default_app_config(tmp_config):
    config = tmp_config.load_app_config()
    assert config.version == 1
    assert config.locale == "de"
    assert config.connection.hass_url == "http://homeassistant.local:8123"


def test_save_and_reload_app_config(tmp_config):
    config = tmp_config.load_app_config()
    config.locale = "en"
    tmp_config.save_app_config(config)
    tmp_config.invalidate_cache()
    reloaded = tmp_config.load_app_config()
    assert reloaded.locale == "en"


def test_load_default_dashboard(tmp_config):
    dashboard = tmp_config.load_dashboard()
    assert dashboard.version == 1
    assert dashboard.theme == "sap_horizon_dark"
    assert dashboard.views == []


def test_save_dashboard_with_views(tmp_config):
    dashboard = tmp_config.load_dashboard()
    view = ViewConfig(
        id="test",
        name="Test View",
        sections=[
            Section(
                id="sec1",
                title="Lights",
                items=[CardItem(id="c1", type="light", entity="light.test")]
            )
        ]
    )
    dashboard.views.append(view)
    tmp_config.save_dashboard(dashboard)
    tmp_config.invalidate_cache()
    reloaded = tmp_config.load_dashboard()
    assert len(reloaded.views) == 1
    assert reloaded.views[0].name == "Test View"
    assert reloaded.views[0].sections[0].items[0].entity == "light.test"


def test_is_configured_false_initially(tmp_config):
    assert tmp_config.is_configured() is False


def test_is_configured_true_after_save(tmp_config):
    tmp_config.save_app_config(tmp_config.load_app_config())
    assert tmp_config.is_configured() is True
