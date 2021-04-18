# Obsidian Jira Issue Plugin

An [Obsidian.md](https://obsidian.md/) plugin that show Jira issue details.

## Requirements

- A Jira instance endpoint (Cloud or Server)
- An Atlassian account email and [API token](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)

## Installation

Download zip archive from [GitHub releases page](https://github.com/daaru00/obsidian-jira-issue/releases) and extract it into `<vault>/.obsidian/plugins` directory.

## Configurations

In order to show issues details the plugin need to be configured with `host`, `email` and `API token` configuration.

![credentials settings](./doc/imgs/jira-credentials-settings.png)

## Usage

Add this code block where you want to show the issue widget:
````makrdown
```jira
JRA-123
```
````

or add multiple keys, one for each line, to show a grid of widgets:
````makrdown
```jira
JRA-123
JRA-124
JRA-125
JRA-126
JRA-127
JRA-128
```
````

Open the preview mode to see issue's details:

![issue details](./doc/gifs/jira-details.gif)

## Usage with Time Tracker

This plugin is compatible with [Time Tracker Plugin](https://github.com/daaru00/obsidian-timer-tracker), you can start a timer and save it as Jira Work Log:

![issue time tracker](./doc/gifs/jira-time-tracker.gif)
