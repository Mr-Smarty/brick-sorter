# brick-sorter-cli

## Install

You will need Node JS installed. If you run into issues, note the project was built with `v22.16.0`.

### Physical Webcam

This applies if:

-   You have a physical webcam, USB camera, etc.
-   You can connect your phone or another device such that its detected as a physical camera by your computer

Follow the steps below to install the project.

1. install npm modules with this command:

    ```
    npm run install:physical
    ```

2. Configure CLI parameters:

    1. Make a copy of `example.env` in the same folder.
    2. Rename copy to `.env`.
    3. Fill fields. You will need to make an account with [Rebrickable](https://rebrickable.com/home/) to get an API key from the profile settings. Your `CAMERA_TYPE` is `physical`.

3. Build the project:

    ```
    npm run build
    ```

4. Install the CLI globally:

    ```
    npm install --global C:/path/to/brick-sorter
    ```

    - Test by running `brick-sorter-cli`. If it can't find the command, run the install command above again in a new terminal outside the repository.

### OpenCV

Follow these instructions to use OpenCV for your camera. This makes it possible to use DirectShow devices such as the OBS Virtual Camera.

These instructions will cover a manual installation on Windows, given the numerous issues that are possible trying to install automatically. If you can successfully install automatically, feel free. Some steps may have already been completed if you've previously used Node JS. Links are included for installation on other platforms.

1. Prepare to install `node-gyp`. More instruction and options [here](https://github.com/nodejs/node-gyp).

    1. Install Python from [website](https://www.python.org/downloads/), Microsoft Store, or package manager.
        - double check the installation by running `python --version` in a new terminal.
    2. Install Visual Studio from [here](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community). Select the `Desktop development with C++` workload when installing. When done, restart your computer.
        - You can remove components, but at minimum keep `MSVC v1** - VS 20** C++ x64/x86 build tools` and `Windows 11 SDK` selected.

2. Install OpenCV from [here](https://opencv.org/releases/). The extracted `opencv` folder can be placed anywhere

3. Create the following environment variables to point to your installation:

    ```
    OPENCV_BIN_DIR = C:\path\to\opencv\build\x64\vc**\bin
    OPENCV_INCLUDE_DIR = C:\path\to\opencv\build\include
    OPENCV_LIB_DIR = C:\path\to\opencv\build\x64\vc**\lib
    ```

    Add `%OPENCV_BIN_DIR%` to your `PATH` variable as well.

4. Create an environment variable to disable automatic OpenCV installation.

    ```
    OPENCV4NODEJS_DISABLE_AUTOBUILD = 1
    ```

    This variable can be deleted at the end.

5. Open the repository in VS Code or a terminal. Install npm modules with this command:

    ```
    npm run install:opencv
    ```

    _This will take awhile._

6. Configure CLI parameters:

    1. Make a copy of `example.env` in the same folder.
    2. Rename copy to `.env`.
    3. Fill fields. You will need to make an account with [Rebrickable](https://rebrickable.com/home/) to get an API key from the profile settings. Your `CAMERA_TYPE` is `opencv`.

7. Build the project:

    ```
    npm run build
    ```

8. Install the CLI globally:

    ```
    npm install --global C:/path/to/brick-sorter
    ```

    - Test by running `brick-sorter-cli`. If it can't find the command, run the install command above again in a new terminal outside the repository.

## CLI

```
$ brick-sorter-cli --help

  Usage
    $ brick-sorter-cli

  Options
    --name  Your name

  Examples
    $ brick-sorter-cli --name=Jane
    Hello, Jane
```
