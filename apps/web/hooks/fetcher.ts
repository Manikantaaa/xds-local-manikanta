import { useUserContext } from "@/context/store";
import { auth } from "@/services/firebase";
import axios from "axios";
import { signOut } from "firebase/auth";
import Cookies from "js-cookie";

export const fetcher = async (url: string, cancelToken?: any) => {
  try {
    const token = Cookies.get("token");
    const response = await axios.get(url, {
     // withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cancelToken: cancelToken,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
        await signOut(auth);
        Cookies.remove("token");
        // localStorage.setItem("tokenExpired", "1");
        // window.location.reload();
        window.location.href = '/login';
      }
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
};

export const patch = async (url: string) => {
  try {
    const token = Cookies.get("token");
    const response = await axios.patch(url,null,{
     // withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
        await signOut(auth);
        Cookies.remove("token");
        localStorage.setItem("tokenExpired", "1");
        // localStorage.setItem("tokenExpired", "1");
        // window.location.reload();
        window.location.href = '/login';
      }
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
};

export const deleteItem = async (url: string) => {
  try {
    const token = Cookies.get("token");
    const response = await axios.delete(url,{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
        await signOut(auth);
        Cookies.remove("token");
        // localStorage.setItem("tokenExpired", "1");
        // window.location.reload();
        window.location.href = '/login';
      }
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
};

export const authFetcher = async (url: string) => {
  try {
    const token = Cookies.get("token");
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
        await signOut(auth);
        Cookies.remove("token");
        // localStorage.setItem("tokenExpired", "1");
        // window.location.reload();
        window.location.href = '/login';
      }
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
};

export const authFileFetcher = async (url: string) => {
  try {
    const token = Cookies.get("token");
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
        await signOut(auth);
        Cookies.remove("token");
        // localStorage.setItem("tokenExpired", "1");
        // window.location.reload();
        window.location.href = '/login';
      }
      const blob = error.response?.data;
      if (blob) {
        // Convert blob to text
        const text = await blob.text();
        // Parse text to JSON
        const json = JSON.parse(text);
        const errorMessage = json.message || "An error occurred while fetching the data";
        throw new Error(errorMessage);
      }
      
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authFileFetcherByPost = async (url: string, postData: any) => {
  try {
    const token = Cookies.get("token");
    const response = await axios.post(url, postData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
        await signOut(auth);
        Cookies.remove("token");
        // localStorage.setItem("tokenExpired", "1");
        // window.location.reload();
        window.location.href = '/login';
      }
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
}

export const authPut = async (url: string) => {
  try {
    const token = Cookies.get("token");
    const response = await axios.put(url, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
        await signOut(auth);
        Cookies.remove("token");
        // localStorage.setItem("tokenExpired", "1");
        // window.location.reload();
        window.location.href = '/login';
      }
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
};

export const DeleteFiles = async (filepath:string, url:string) => {
  try {
    const token = Cookies.get("token");
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filepath }),
    });
    return {
      success : true,
      message: 'successfully deleted',
      response
    };
  } catch (error) {
    return {
      success: false,
      message: error,
    }
  }
}

export const authPostdata = async <T>(url: string, postData: T, cancelToken?:any) => {
  try {
    const token = Cookies.get("token");
    const response = await axios.post(url, postData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cancelToken: cancelToken,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
        await signOut(auth);
        Cookies.remove("token");
        // localStorage.setItem("tokenExpired", "1");
        // window.location.reload();
        window.location.href = '/login';
      }
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
}

export const authPutWithData = async <T>(url: string, postData: T) => {
  try {
    const token = Cookies.get("token");
    const response = await axios.put(url, postData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
        await signOut(auth);
        Cookies.remove("token");
        // localStorage.setItem("tokenExpired", "1");
        // window.location.reload();
        window.location.href = '/login';
      }
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
};

export const withoutAuthPostData = async <T>(url: string, postData: T) => {
  try {
    const response = await axios.post(url, postData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data);
      throw new Error(
        error.response?.data?.message ||
        "An error occurred while fetching the data",
      );
    } else {
      console.error(error);
      throw new Error("An error occurred while fetching the data");
    }
  }
}


